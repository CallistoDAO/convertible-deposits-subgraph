#!/usr/bin/env node

/**
 * Generate config.yaml from config.yaml.handlebars template and config.json
 *
 * Usage:
 *   node generate-config.js [config-json-path] [output-path]
 *
 * Defaults:
 *   config-json-path: config.json
 *   output-path: config.yaml
 *
 * Environment Variables:
 *   ETHERSCAN_API_KEY: Optional Etherscan API key for higher rate limits
 *   Can be set via .env file or exported in shell
 */

import fs from "node:fs";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";
import Handlebars from "handlebars";

// Load environment variables from .env file
dotenvConfig();

const configJsonPath = process.argv[2] || "config.json";
const outputPath = process.argv[3] || "config.yaml";
const templatePath = "config.yaml.handlebars";
const deploymentsPath = "olympus-v3/deployments";

/**
 * Network name to chain ID mapping
 */
const NETWORK_TO_CHAIN_ID = {
  mainnet: 1,
  sepolia: 11155111,
  goerli: 5,
  "base-sepolia": 84532,
};

/**
 * Parse contract names from the template file
 */
function parseContractNamesFromTemplate() {
  try {
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const contractNames = [];

    // Match pattern: "- name: ContractName"
    const nameMatches = templateContent.matchAll(/^\s*-\s*name:\s*(\w+)/gm);

    for (const match of nameMatches) {
      const contractName = match[1];
      if (contractName) {
        contractNames.push(contractName);
      }
    }

    return contractNames;
  } catch (error) {
    console.warn(`⚠ Failed to parse template: ${error.message}`);
    return [];
  }
}

/**
 * Get Etherscan API v2 base URL (multichain)
 */
function getEtherscanApiUrl() {
  // V2 API uses a single endpoint for all chains
  return "https://api.etherscan.io/v2/api";
}

/**
 * Read and parse deployment files from olympus-v3/deployments
 * Returns merged contracts with the latest version of each contract per network
 */
function getLatestDeployments() {
  if (!fs.existsSync(deploymentsPath)) {
    console.log(`⚠ Deployments directory not found: ${deploymentsPath}`);
    return {};
  }

  const files = fs.readdirSync(deploymentsPath);
  const deployments = {};

  // First, collect all deployment files per network with their timestamps
  const networkFiles = {};

  for (const file of files) {
    // Match pattern: .network-timestamp.json or network-timestamp.json
    const match = file.match(/^\.?([a-z-]+)-(\d+)\.json$/);
    if (!match) continue;

    const [, network, timestamp] = match;
    const timestampNum = parseInt(timestamp, 10);

    if (!networkFiles[network]) {
      networkFiles[network] = [];
    }

    try {
      const filePath = path.join(deploymentsPath, file);
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      networkFiles[network].push({
        file,
        timestamp: timestampNum,
        contracts: content,
      });
    } catch (error) {
      console.warn(`⚠ Failed to parse ${file}: ${error.message}`);
    }
  }

  // For each network, merge contracts keeping the latest version of each
  for (const [network, files] of Object.entries(networkFiles)) {
    // Sort by timestamp (oldest to newest)
    files.sort((a, b) => a.timestamp - b.timestamp);

    const mergedContracts = {};
    const contractSources = {}; // Track which file each contract came from
    let latestTimestamp = 0;

    // Merge contracts, later timestamps override earlier ones
    for (const deployment of files) {
      latestTimestamp = Math.max(latestTimestamp, deployment.timestamp);
      for (const [contractName, address] of Object.entries(deployment.contracts)) {
        mergedContracts[contractName] = address;
        contractSources[contractName] = deployment.file;
      }
    }

    deployments[network] = {
      timestamp: latestTimestamp,
      contracts: mergedContracts,
      contractSources, // Track source file for debugging
      filesProcessed: files.length,
    };
  }

  return deployments;
}

/**
 * Find contract address in deployment by name
 * Supports exact match or suffix match (e.g., "olympus.periphery.ContractName" matches "ContractName")
 */
function findContractInDeployment(contractName, deploymentContracts) {
  const deploymentKeys = Object.keys(deploymentContracts);

  // Try exact match first
  if (deploymentContracts[contractName]) {
    return { key: contractName, address: deploymentContracts[contractName] };
  }

  // Try suffix match (case-insensitive)
  const matchedKey = deploymentKeys.find((key) =>
    key.toLowerCase().endsWith(contractName.toLowerCase()),
  );

  if (matchedKey) {
    return { key: matchedKey, address: deploymentContracts[matchedKey] };
  }

  return null;
}

/**
 * Discover contract addresses from deployment files for a specific network
 */
function discoverContractAddressesForNetwork(networkConfig, deployments, contractNames) {
  // Determine network name from chain ID
  const chainId = networkConfig.chainId;
  const networkName = Object.keys(NETWORK_TO_CHAIN_ID).find(
    (net) => NETWORK_TO_CHAIN_ID[net] === chainId,
  );

  if (!networkName) {
    console.log(`⚠ Unknown chain ID: ${chainId}, skipping deployment discovery`);
    return;
  }

  const networkDeployment = deployments[networkName];
  if (!networkDeployment) {
    console.log(`⚠ No deployments found for network: ${networkName}`);
    return;
  }

  console.log(`📂 Found ${networkDeployment.filesProcessed} deployment file(s) for ${networkName}`);
  console.log(`   Merged ${Object.keys(networkDeployment.contracts).length} unique contracts`);

  // Map contracts from deployment to network config
  let foundCount = 0;
  const availableContracts = Object.keys(networkDeployment.contracts);

  for (const contractName of contractNames) {
    const currentAddress = networkConfig[contractName];

    // Skip if address is already set to a valid value (not empty, not placeholder)
    if (currentAddress && currentAddress !== "" && currentAddress !== "0x...") {
      console.log(`   Skipping ${contractName}: already set to ${currentAddress}`);
      continue;
    }

    // Need to discover: address is undefined, empty string, or placeholder
    console.log(`   Searching for ${contractName}...`);

    // Find matching contract in deployment
    const match = findContractInDeployment(contractName, networkDeployment.contracts);

    if (match) {
      networkConfig[contractName] = match.address;
      foundCount++;
      const sourceFile = networkDeployment.contractSources[match.key];
      console.log(`   ✓ Discovered ${match.key} → ${contractName}: ${match.address}`);
      console.log(`     (from ${sourceFile})`);
    } else {
      console.log(`   ✗ Not found in deployment files`);
      // Keep the original value (could be undefined, "", or "0x...")
    }
  }

  if (foundCount === 0) {
    console.log(`   No matching contracts found in deployment file`);
    console.log(`   Available contracts: ${availableContracts.join(", ")}`);
  }
}

/**
 * Fetch contract creation block from Etherscan v2 API
 */
async function fetchContractCreationBlock(chainId, address) {
  const apiUrl = getEtherscanApiUrl();
  const apiKey = process.env.ETHERSCAN_API_KEY || "";

  // Use v2 API with chainid parameter
  const creationUrl = `${apiUrl}?chainid=${chainId}&module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${apiKey}`;

  try {
    const response = await fetch(creationUrl);
    const data = await response.json();

    if (data.status === "1" && data.result && data.result.length > 0) {
      const result = data.result[0];
      // V2 API returns blockNumber as a string (decimal, not hex)
      return parseInt(result.blockNumber, 10);
    }

    // If status is not "1", throw error with message
    const errorMsg = data.message || "Unknown error";
    if (data.result) {
      throw new Error(`${errorMsg} - ${data.result}`);
    }
    throw new Error(errorMsg);
  } catch (error) {
    console.warn(`⚠ Warning: Could not fetch creation block for ${address}: ${error.message}`);
    if (!apiKey) {
      console.warn(`   💡 Tip: Set ETHERSCAN_API_KEY environment variable for better rate limits`);
    }
    return null;
  }
}

/**
 * Fetch deployment blocks for contracts with block set to 0
 */
async function fetchDeploymentBlocks(networkConfig, contractNames) {
  for (const contractName of contractNames) {
    const blockKey = `${contractName}_BLOCK`;
    const address = networkConfig[contractName];
    const currentBlock = networkConfig[blockKey];

    if (
      address &&
      address !== "" &&
      address !== "0x..." &&
      (currentBlock === 0 || currentBlock === undefined)
    ) {
      console.log(`⏳ Fetching creation block for ${contractName} (${address})...`);

      const block = await fetchContractCreationBlock(networkConfig.chainId, address);

      if (block !== null) {
        networkConfig[blockKey] = block;
        console.log(`✓ ${contractName} deployed at block ${block}`);
      } else {
        console.log(`✗ Could not determine creation block for ${contractName}, using 0`);
        networkConfig[blockKey] = 0;
      }

      // Rate limit to avoid hitting API limits (5 requests per second for free tier)
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

async function main() {
  try {
    // Read the template
    const template = fs.readFileSync(templatePath, "utf-8");

    // Parse contract names from template
    const contractNames = parseContractNamesFromTemplate();
    console.log(
      `📝 Parsed ${contractNames.length} contracts from template: ${contractNames.join(", ")}`,
    );

    // Read the config JSON
    const configData = JSON.parse(fs.readFileSync(configJsonPath, "utf-8"));

    // Get all deployment data once
    console.log("\n🔍 Reading deployment files...");
    const deployments = getLatestDeployments();

    // Process each network
    for (const network of configData.networks) {
      console.log(`\n🌐 Processing ${network.name} (Chain ID: ${network.chainId})...`);

      // Discover contract addresses from deployment files
      discoverContractAddressesForNetwork(network, deployments, contractNames);

      // Fetch deployment blocks if needed
      console.log(`\n📦 Fetching deployment blocks for ${network.name}...`);
      await fetchDeploymentBlocks(network, contractNames);

      // Calculate network start block as minimum of all contract deployment blocks
      const contractBlocks = contractNames
        .map((name) => network[`${name}_BLOCK`])
        .filter((block) => block && block > 0);

      if (contractBlocks.length > 0) {
        network.startBlock = Math.min(...contractBlocks);
        console.log(
          `✓ ${network.name} start block set to ${network.startBlock} (earliest contract)`,
        );
      } else if (!network.startBlock) {
        network.startBlock = 0;
        console.log(`⚠ ${network.name} start block defaulting to 0 (no contract blocks found)`);
      }
    }

    // Compile the template
    const compiledTemplate = Handlebars.compile(template);

    // Generate the output with enriched data (addresses, blocks)
    const output = compiledTemplate(configData);

    // Write the output file
    fs.writeFileSync(outputPath, output, "utf-8");

    console.log(`\n✅ Generated ${outputPath} from ${templatePath} using ${configJsonPath}`);
    console.log(`   (${configJsonPath} left unchanged - enrichment done dynamically)`);
  } catch (error) {
    console.error(`✗ Error generating config:`, error.message);
    process.exit(1);
  }
}

main();
