import type { contract } from "generated/src/ConfigYAML.gen";
import { getGeneratedByChainId } from "generated/src/ConfigYAML.gen";
import type { Hex } from "viem";
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
  auctioneerAddress: Hex,
): string {
  return buildEntityId([chainId, blockNumber, auctioneerAddress.toLowerCase()]);
}

export function getAuctioneerDepositPeriodSnapshotId(
  chainId: number,
  blockNumber: number | bigint,
  auctioneerAddress: Hex,
  depositAssetAddress: Hex,
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
 * Get the ID for a DepositFacilitySnapshot entity
 */
export function getDepositFacilitySnapshotId(
  chainId: number,
  blockNumber: number | bigint,
  facilityAddress: Hex,
): string {
  return buildEntityId([chainId, blockNumber, facilityAddress.toLowerCase()]);
}

/**
 * Get the ID for a DepositFacilityAssetSnapshot entity
 */
export function getDepositFacilityAssetSnapshotId(
  chainId: number,
  blockNumber: number | bigint,
  facilityAddress: Hex,
  assetAddress: Hex,
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
