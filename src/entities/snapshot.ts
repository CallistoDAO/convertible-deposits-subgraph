import type {
  Auctioneer,
  AuctioneerDepositPeriod,
  AuctioneerDepositPeriodSnapshot,
  AuctioneerSnapshot,
  LatestSnapshot,
} from "generated";
import type { HandlerContext } from "generated/src/Types";
import {
  fetchAuctioneerCurrentTick,
  fetchAuctioneerDayState,
  fetchAuctioneerParameters,
} from "../contracts/auctioneer";
import { toDecimal, toOhmDecimal } from "../utils/decimal";
import {
  getAuctioneerDepositPeriodSnapshotId,
  getAuctioneerSnapshotId,
  getLatestSnapshotId,
} from "../utils/snapshot";
import { getAsset, getDepositAsset, getDepositAssetDecimals, getDepositAssetPeriod } from "./asset";
import { getAuctioneer } from "./auctioneer";

/**
 * Get or create the LatestSnapshot entity for a chain
 */
export async function getOrCreateLatestSnapshot(
  context: HandlerContext,
  chainId: number,
): Promise<LatestSnapshot> {
  const id = getLatestSnapshotId(chainId);
  const existing = await context.LatestSnapshot.get(id);

  if (existing) {
    return existing as LatestSnapshot;
  }

  const created: LatestSnapshot = {
    id,
    chainId,
    auctioneerSnapshotIds: [],
    facilitySnapshotIds: [],
    redemptionVaultSnapshotIds: [],
  };

  context.LatestSnapshot.set(created);
  return created;
}

/**
 * Create an AuctioneerSnapshot for the given auctioneer
 */
export async function getOrCreateAuctioneerSnapshot(
  context: HandlerContext,
  chainId: number,
  blockNumber: number | bigint,
  auctioneer: Auctioneer,
): Promise<AuctioneerSnapshot> {
  const snapshotId = getAuctioneerSnapshotId(chainId, blockNumber, auctioneer.address);

  // Check if snapshot already exists
  const existingSnapshot = await context.AuctioneerSnapshot.get(snapshotId);
  if (existingSnapshot) {
    return existingSnapshot as AuctioneerSnapshot;
  }

  // Fetch day state and auction parameters from contract
  const [dayState, auctionParameters] = await Promise.all([
    context.effect(fetchAuctioneerDayState, {
      chainId,
      address: auctioneer.address,
    }),
    context.effect(fetchAuctioneerParameters, {
      chainId,
      address: auctioneer.address,
    }),
  ]);

  // Get enabled deposit periods from database
  // Note: Since auctioneer_id is not indexed, we need to get all periods for the chain and filter
  const allAuctioneerDepositPeriods =
    await context.AuctioneerDepositPeriod.getWhere.chainId.eq(chainId);
  const auctioneerDepositPeriods = allAuctioneerDepositPeriods.filter(
    (period) => period.auctioneer_id === auctioneer.id,
  );

  // Get asset decimals for price conversion
  const assetDecimals = await getDepositAssetDecimals(context, auctioneer.depositAsset_id);

  // Create the main auctioneer snapshot with fresh contract data
  const snapshot: AuctioneerSnapshot = {
    id: snapshotId,
    chainId,
    block: BigInt(blockNumber),
    auctioneer_id: auctioneer.id,
    dayInitTimestamp: dayState.dayInitTimestamp,
    ohmSold: dayState.convertible,
    ohmSoldDecimal: toOhmDecimal(dayState.convertible),
    isAuctionActive: auctioneer.enabled, // Use enabled status as proxy for active
    target: auctionParameters.target,
    targetDecimal: toOhmDecimal(auctionParameters.target),
    tickSize: auctionParameters.tickSize,
    tickSizeDecimal: toOhmDecimal(auctionParameters.tickSize),
    minPrice: auctionParameters.minPrice,
    minPriceDecimal: toDecimal(auctionParameters.minPrice, assetDecimals),
  };
  context.AuctioneerSnapshot.set(snapshot);

  // Create separate snapshots for each enabled deposit period
  for (const auctioneerDepositPeriod of auctioneerDepositPeriods) {
    // Skip if the deposit period is for a different auctioneer
    if (auctioneerDepositPeriod.auctioneer_id !== auctioneer.id) continue;

    await getOrCreateAuctioneerDepositPeriodSnapshot(
      context,
      chainId,
      blockNumber,
      snapshot,
      auctioneerDepositPeriod,
    );
  }

  // Update LatestSnapshot
  await updateLatestSnapshotAuctioneers(context, chainId, auctioneer.address, snapshotId);

  return snapshot;
}

export async function getOrCreateAuctioneerDepositPeriodSnapshot(
  context: HandlerContext,
  chainId: number,
  blockNumber: number | bigint,
  auctioneerSnapshot: AuctioneerSnapshot,
  auctioneerDepositPeriod: AuctioneerDepositPeriod,
): Promise<AuctioneerDepositPeriodSnapshot> {
  // Get asset details
  const depositAssetPeriod = await getDepositAssetPeriod(
    context,
    auctioneerDepositPeriod.depositAssetPeriod_id,
  );
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  const asset = await getAsset(context, depositAsset.asset_id);

  // Get the auctioneer to get the address
  const auctioneer = await getAuctioneer(context, auctioneerDepositPeriod.auctioneer_id);

  const snapshotId = getAuctioneerDepositPeriodSnapshotId(
    chainId,
    blockNumber,
    auctioneer.address,
    asset.address,
    depositAssetPeriod.periodMonths,
  );

  // Check if snapshot already exists
  const existingSnapshot = await context.AuctioneerDepositPeriodSnapshot.get(snapshotId);
  if (existingSnapshot) {
    return existingSnapshot as AuctioneerDepositPeriodSnapshot;
  }

  // Fetch current tick for this specific period
  const currentTick = await context.effect(fetchAuctioneerCurrentTick, {
    chainId,
    address: auctioneer.address,
    depositPeriod: depositAssetPeriod.periodMonths,
  });

  const periodSnapshot: AuctioneerDepositPeriodSnapshot = {
    id: snapshotId,
    chainId,
    block: BigInt(blockNumber),
    auctioneerSnapshot_id: auctioneerSnapshot.id,
    auctioneerDepositPeriod_id: auctioneerDepositPeriod.id,
    currentTickPrice: currentTick.price,
    currentTickPriceDecimal: toDecimal(currentTick.price, asset.decimals),
    currentTickCapacity: currentTick.capacity,
    currentTickCapacityDecimal: toOhmDecimal(currentTick.capacity),
  };
  context.AuctioneerDepositPeriodSnapshot.set(periodSnapshot);

  return periodSnapshot;
}

/**
 * Update the LatestSnapshot to include the new auctioneer snapshot
 */
export async function updateLatestSnapshotAuctioneers(
  context: HandlerContext,
  chainId: number,
  auctioneerAddress: string,
  newSnapshotId: string,
): Promise<void> {
  const latestSnapshot = await getOrCreateLatestSnapshot(context, chainId);

  // Remove any existing snapshot for this auctioneer
  const filteredIds = latestSnapshot.auctioneerSnapshotIds.filter((id) => {
    // Extract chainId and auctioneer address from snapshot ID (format: chainId_blockNumber_auctioneerAddress)
    const parts = id.split("_");
    const existingAuctioneerAddress = parts[2];

    // We want to return IDs that are for different auctioneers
    return existingAuctioneerAddress.toLowerCase() !== auctioneerAddress.toLowerCase();
  });

  // Add the new snapshot ID
  const updatedIds = [...filteredIds, newSnapshotId];

  const updatedSnapshot: LatestSnapshot = {
    ...latestSnapshot,
    auctioneerSnapshotIds: updatedIds,
  };

  context.LatestSnapshot.set(updatedSnapshot);
}

/**
 * Refresh auction state from contract and create snapshot
 */
export async function refreshAuctionState(
  context: HandlerContext,
  chainId: number,
  blockNumber: number | bigint,
  auctioneer: Auctioneer,
): Promise<AuctioneerSnapshot> {
  // Create snapshot with fresh contract data
  const snapshot = await getOrCreateAuctioneerSnapshot(context, chainId, blockNumber, auctioneer);

  return snapshot;
}
