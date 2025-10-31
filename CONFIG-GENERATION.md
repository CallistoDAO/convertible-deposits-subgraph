# Dynamic Config Generation

This project uses Handlebars templates to dynamically generate `config.yaml` from a JSON configuration file with automatic contract deployment block fetching.

## Files

- **config.yaml.handlebars** - Template file with variable placeholders
- **config.json** - Configuration values (addresses, block numbers, chain IDs)
- **generate-config.js** - Generation script with Etherscan v2 API integration
- **config.yaml** - Generated output (auto-generated, do not edit manually)

## Features

- **Multi-Network Support**: Configure multiple networks (Sepolia, Mainnet, etc.) in a single config file
- **Automatic Block Fetching**: Automatically fetches contract deployment blocks from Etherscan v2 API
- **Per-Contract Start Blocks**: Each contract can have its own start_block for efficient indexing
- **Multi-Chain Support**: Uses Etherscan v2 multichain API (single endpoint for all networks)
- **Automatic Address Discovery**: Discovers contract addresses from olympus-v3 deployment files
- **Fallback to Manual**: If API fails, blocks can be set manually in config.json

## Usage

### Generate config.yaml

```bash
pnpm generate-config
```

This will:
1. **Parse contract names** from `config.yaml.handlebars` template
2. Read `config.json` for base configuration (network, chain ID)
3. **Search `olympus-v3/deployments/`** for matching contract addresses (merges all deployment files)
4. **Automatically fetch deployment blocks** from Etherscan v2 API
5. **Calculate network start_block** as minimum of all contract blocks
6. **Generate `config.yaml`** with all enriched data
7. **Leave `config.json` unchanged** - enrichment is done dynamically in memory

**Key Point:** Your config file stays minimal - just network info. All addresses and blocks are discovered/fetched dynamically!

### With Etherscan API Key (Recommended)

For automatic block fetching, set your Etherscan API key. You can do this in two ways:

**Option 1: Using .env file (recommended)**

1. Copy `.env.example` to `.env` if you haven't already
2. Add your Etherscan API key to `.env`:
   ```bash
   ETHERSCAN_API_KEY="your_api_key_here"
   ```
3. Run the generator:
   ```bash
   pnpm generate-config
   ```

**Option 2: Using environment variable**

```bash
export ETHERSCAN_API_KEY="your_api_key_here"
pnpm generate-config
```

Get a free API key at [https://etherscan.io/myapikey](https://etherscan.io/myapikey)

### Custom Paths

```bash
node generate-config.js [config-json-path] [output-path]

# Examples:
node generate-config.js config.sepolia.json config.sepolia.yaml
node generate-config.js config.mainnet.json config.mainnet.yaml
```

## Configuration Variables

The `config.json` file is **minimal** - just specify the networks! The script automatically:
1. Parses contract names from `config.yaml.handlebars`
2. Discovers addresses from `olympus-v3/deployments/` (merges all files)
3. Fetches deployment blocks from Etherscan
4. Calculates network start_block
5. **Does NOT write back to config.json** - enrichment is done in memory

**Minimal Single-Network Config (config.sepolia.json):**
```json
{
  "networks": [
    {
      "name": "sepolia",
      "chainId": 11155111
    }
  ]
}
```

**Multi-Network Config (config.multi.json):**
```json
{
  "networks": [
    {
      "name": "sepolia",
      "chainId": 11155111
    },
    {
      "name": "mainnet",
      "chainId": 1
    }
  ]
}
```

**Optional: Override specific contracts** (if you want to use different addresses):
```json
{
  "networks": [
    {
      "name": "sepolia",
      "chainId": 11155111,
      "ConvertibleDepositAuctioneer": "0xCustomAddress...",
      "ConvertibleDepositAuctioneer_BLOCK": 9179736
    }
  ]
}
```

**Key Benefits:**
- **Stays minimal**: Config file only needs network + chain ID
- **No manual updates**: Script doesn't write back to config.json
- **Auto-discovery**: Reads all deployment files and merges contracts
- **Flexible matching**: Finds contracts by exact match or suffix (e.g., "olympus.policies.ContractName" → "ContractName")
- **Cache-friendly**: Config file can be committed as-is without generated values

### Block Number Behavior

**All blocks are fetched/calculated dynamically** - nothing is written back to config.json!

**Contract Deployment Blocks:**
- **Not in config**: Script fetches from Etherscan v2 API automatically
- **Specified in config**: Script uses your value and skips API fetch
- **Result**: Used in memory only to generate config.yaml

**Network Start Block:**
- **Auto-calculated**: Set to the minimum (earliest) of all contract deployment blocks
- Satisfies Envio's schema requirement (network start_block is required)
- Each contract can have its own start_block >= network start_block
- **Calculated in memory** - not written to config.json

### How It Works

**1. Automatic Contract Discovery**

The script parses `config.yaml.handlebars` to extract contract names:
```yaml
- name: ConvertibleDepositAuctioneer  # ← Extracted automatically
- name: ConvertibleDepositFacility    # ← Extracted automatically
- name: DepositRedemptionVault        # ← Extracted automatically
```

Then searches `olympus-v3/deployments/.{network}-{timestamp}.json` for matching contracts:
- Exact match: `"ConvertibleDepositAuctioneer": "0x..."`
- Suffix match: `"olympus.periphery.ConvertibleDepositAuctioneer": "0x..."` → `ConvertibleDepositAuctioneer`

**2. Generated Config Structure**

```yaml
networks:
- id: 11155111
  start_block: 9179734                         # ← Minimum of all contracts (required by schema)
  contracts:
  - name: ConvertibleDepositAuctioneer
    address: [0xc14156AF3bF6c11b1c40C8f51f64bA5496870126]
    start_block: 9179736                       # ← Specific contract start
  - name: ConvertibleDepositFacility
    address: [0x87568265eb6Ea27f37613d242D4192B6f6771269]
    start_block: 9179735                       # ← Specific contract start
  - name: DepositRedemptionVault
    address: [0x69b2Be653BAB628116b360818BE75a2d97b45C4a]
    start_block: 9179734                       # ← Earliest contract
```

This approach is **much more efficient** than using `start_block: 0`, as it:
- Skips indexing ~9.18M empty blocks on Sepolia
- Reduces initial sync time dramatically
- Sets optimal start blocks per contract (if deployed at different blocks)

## Multi-Network Setup

You can configure multiple networks in two ways:

**Option 1: Single config file with multiple networks (Recommended)**

Create one config file with all networks:

```bash
# config.multi.json
{
  "networks": [
    { "name": "sepolia", "chainId": 11155111 },
    { "name": "mainnet", "chainId": 1 }
  ]
}

# Generate config for all networks at once
node generate-config.js config.multi.json config.yaml
```

**Option 2: Separate config files per network**

Create individual config files for each network:

```bash
# Sepolia only
node generate-config.js config.sepolia.json config.sepolia.yaml

# Mainnet only
node generate-config.js config.mainnet.json config.mainnet.yaml
```

## Workflow

1. **Update config.json** - Change addresses, blocks, or chain ID
2. **Run generation** - `pnpm generate-config`
3. **Verify output** - Check `config.yaml` looks correct
4. **Run codegen** - `pnpm codegen` (if schema changes)
5. **Test** - `pnpm dev`

## Important Notes

- Events and handlers are hardcoded in the template (not in config.json)
- Always use `pnpm generate-config` after modifying `config.json`
- Do not edit `config.yaml` manually - it will be overwritten
- The template preserves all event definitions and handlers
- Per-contract start_blocks improve indexing efficiency dramatically

## Troubleshooting

### API Key Issues

If you see "Missing/Invalid API Key" errors:

1. Get a free API key at [https://etherscan.io/myapikey](https://etherscan.io/myapikey)
2. Add it to your `.env` file:
   ```bash
   ETHERSCAN_API_KEY="your_key_here"
   ```
   Or export as environment variable:
   ```bash
   export ETHERSCAN_API_KEY="your_key_here"
   ```
3. Run the script again

### Manual Block Configuration

If you can't use the Etherscan API or prefer manual configuration:

1. Find the deployment transaction on Etherscan (e.g., https://sepolia.etherscan.io/address/0x...)
2. Note the block number from the contract creation transaction
3. Update the corresponding `*_BLOCK` field in your config.json:
   ```json
   {
     "DEPLOYED_AUCTIONEER_BLOCK": 1234567
   }
   ```
4. Run `pnpm generate-config` - it will use your specified block

### Rate Limiting

The script includes a 250ms delay between API calls to respect Etherscan's rate limits (5 requests/second for free tier). If you have a paid plan, you can reduce this delay in generate-config.js.
