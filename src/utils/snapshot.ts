import type { contract } from "generated/src/ConfigYAML.gen";
import { getGeneratedByChainId } from "generated/src/ConfigYAML.gen";
import { buildEntityId } from "./ids";

/**
 * Get the ID for the LatestSnapshot entity (one per chain)
 */
export function getLatestSnapshotId(chainId: number): string {
  return chainId.toString();
}

/**
 * Get the ID for an AuctioneerSnapshot entity
 */
export function getAuctioneerSnapshotId(
  chainId: number,
  blockNumber: number | bigint,
  auctioneerAddress: string,
): string {
  return buildEntityId([chainId, blockNumber, auctioneerAddress.toLowerCase()]);
}

export function getAuctioneerDepositPeriodSnapshotId(
  chainId: number,
  blockNumber: number | bigint,
  auctioneerAddress: string,
  depositAssetAddress: string,
  periodMonths: number,
): string {
  return buildEntityId([
    chainId,
    blockNumber,
    auctioneerAddress.toLowerCase(),
    depositAssetAddress.toLowerCase(),
    periodMonths,
  ]);
}

/**
 * Get the ID for a FacilitySnapshot entity
 */
export function getFacilitySnapshotId(
  chainId: number,
  blockNumber: number | bigint,
  facilityAddress: string,
): string {
  return buildEntityId([chainId, blockNumber, facilityAddress.toLowerCase()]);
}

/**
 * Get the ID for a FacilityAssetSnapshot entity
 */
export function getFacilityAssetSnapshotId(
  chainId: number,
  blockNumber: number | bigint,
  facilityAddress: string,
  assetAddress: string,
): string {
  return buildEntityId([
    chainId,
    blockNumber,
    facilityAddress.toLowerCase(),
    assetAddress.toLowerCase(),
  ]);
}

/**
 * Extract auctioneer addresses from config
 */
export function getAuctioneerAddressesFromConfig(chainId: number): string[] {
  const config = getGeneratedByChainId(chainId);

  const contracts = Object.values(config.contracts).reduce((acc: string[], contract: contract) => {
    if (!contract.name.includes("Auctioneer")) {
      return acc;
    }

    acc.push(...contract.addresses);

    return acc;
  }, [] as string[]);

  return contracts;
}

/**
 * Extract facility addresses from config
 */
export function getFacilityAddressesFromConfig(chainId: number): string[] {
  const config = getGeneratedByChainId(chainId);

  const contracts = Object.values(config.contracts).reduce((acc: string[], contract: contract) => {
    if (!contract.name.includes("Facility")) {
      return acc;
    }

    acc.push(...contract.addresses);

    return acc;
  }, [] as string[]);

  return contracts;
}

/**
 * Extract redemption vault addresses from config
 */
export function getRedemptionVaultAddressesFromConfig(chainId: number): string[] {
  const config = getGeneratedByChainId(chainId);

  const contracts = Object.values(config.contracts).reduce((acc: string[], contract: contract) => {
    if (!contract.name.includes("RedemptionVault")) {
      return acc;
    }

    acc.push(...contract.addresses);

    return acc;
  }, [] as string[]);

  return contracts;
}
