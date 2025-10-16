import type {
  Auctioneer,
  AuctioneerDepositPeriod,
  AuctioneerDepositPeriodSnapshot,
  AuctioneerSnapshot,
  DepositAsset,
  DepositFacility,
  FacilityAssetSnapshot,
  FacilitySnapshot,
  LatestSnapshot,
} from "generated";
import type { HandlerContext } from "generated/src/Types";
import type { Hex } from "viem";
import {
  fetchAuctioneerCurrentTick,
  fetchAuctioneerDayState,
  fetchAuctioneerParameters,
} from "../contracts/auctioneer";
import { fetchFacilityClaimableYield } from "../contracts/depositFacility";
import { toDecimal, toOhmDecimal } from "../utils/decimal";
import {
  getAuctioneerDepositPeriodSnapshotId,
  getAuctioneerSnapshotId,
  getFacilityAssetSnapshotId,
  getFacilitySnapshotId,
  getLatestSnapshotId,
} from "../utils/snapshot";
import { getAsset, getDepositAsset, getDepositAssetDecimals, getDepositAssetPeriod } from "./asset";
import { getAuctioneer } from "./auctioneer";

/**
 * Helper function to fetch claimable yield from contract
 */
async function fetchClaimableYield(
  context: HandlerContext,
  chainId: number,
  facility: DepositFacility,
  depositAsset: DepositAsset,
): Promise<bigint> {
  const asset = await getAsset(context, depositAsset.asset_id);
  return await context.effect(fetchFacilityClaimableYield, {
    chainId,
    facilityAddress: facility.address,
    assetAddress: asset.address,
  });
}

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
    facilityAssetSnapshotIds: [],
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
  timestamp: number | bigint,
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
    timestamp: BigInt(timestamp),
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
      timestamp,
      snapshot,
      auctioneerDepositPeriod,
    );
  }

  // Update LatestSnapshot with this snapshot
  await updateLatestSnapshotAuctioneers(context, chainId, auctioneer.address as Hex, snapshotId);

  return snapshot;
}

export async function getOrCreateAuctioneerDepositPeriodSnapshot(
  context: HandlerContext,
  chainId: number,
  blockNumber: number | bigint,
  timestamp: number | bigint,
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
    timestamp: BigInt(timestamp),
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
  auctioneerAddress: Hex,
  snapshotId: string,
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
  const updatedSnapshot: LatestSnapshot = {
    ...latestSnapshot,
    auctioneerSnapshotIds: [...filteredIds, snapshotId],
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
  timestamp: number | bigint,
  auctioneer: Auctioneer,
): Promise<AuctioneerSnapshot> {
  // Create snapshot with fresh contract data
  const snapshot = await getOrCreateAuctioneerSnapshot(
    context,
    chainId,
    blockNumber,
    timestamp,
    auctioneer,
  );

  return snapshot;
}

/**
 * Get or create a FacilitySnapshot for the given facility
 */
export async function getOrCreateFacilitySnapshot(
  context: HandlerContext,
  chainId: number,
  blockNumber: number | bigint,
  timestamp: number | bigint,
  facility: DepositFacility,
): Promise<FacilitySnapshot> {
  const snapshotId = getFacilitySnapshotId(chainId, blockNumber, facility.address);

  // Check if snapshot already exists
  const existingSnapshot = await context.FacilitySnapshot.get(snapshotId);
  if (existingSnapshot) {
    return existingSnapshot as FacilitySnapshot;
  }

  // Create new snapshot
  const snapshot: FacilitySnapshot = {
    id: snapshotId,
    chainId,
    block: BigInt(blockNumber),
    timestamp: BigInt(timestamp),
    facility_id: facility.id,
  };

  context.FacilitySnapshot.set(snapshot);

  // Update LatestSnapshot
  await updateLatestSnapshotFacilities(context, chainId, facility.address as Hex, snapshotId);

  return snapshot;
}

/**
 * Get or create a FacilityAssetSnapshot for the given facility and asset
 */
export async function getOrCreateFacilityAssetSnapshot(
  context: HandlerContext,
  chainId: number,
  blockNumber: number | bigint,
  timestamp: number | bigint,
  facilitySnapshot: FacilitySnapshot,
  facility: DepositFacility,
  depositAsset: DepositAsset,
): Promise<FacilityAssetSnapshot> {
  const asset = await getAsset(context, depositAsset.asset_id);
  const snapshotId = getFacilityAssetSnapshotId(
    chainId,
    blockNumber,
    facility.address,
    asset.address,
  );

  // Check if snapshot already exists
  const existingSnapshot = await context.FacilityAssetSnapshot.get(snapshotId);
  if (existingSnapshot) {
    return existingSnapshot as FacilityAssetSnapshot;
  }

  // Get the latest snapshot for this facility/asset combo from LatestSnapshot
  const latestSnapshot = await getOrCreateLatestSnapshot(context, chainId);
  const latestSnapshotId = latestSnapshot.facilityAssetSnapshotIds.find((id) => {
    // Extract facility and asset from snapshot ID (format: chainId_blockNumber_facilityAddress_assetAddress)
    const parts = id.split("_");
    const snapshotFacilityAddress = parts[2];
    const snapshotAssetAddress = parts[3];
    return (
      snapshotFacilityAddress.toLowerCase() === facility.address.toLowerCase() &&
      snapshotAssetAddress.toLowerCase() === asset.address.toLowerCase()
    );
  });

  let previousSnapshot: FacilityAssetSnapshot | null = null;
  if (latestSnapshotId) {
    const snapshot = await context.FacilityAssetSnapshot.get(latestSnapshotId);
    previousSnapshot = snapshot || null;
  }

  // Copy values from previous snapshot or initialize to 0
  const totalDeposited = previousSnapshot ? previousSnapshot.totalDeposited : BigInt(0);
  const pendingRedemption = previousSnapshot ? previousSnapshot.pendingRedemption : BigInt(0);
  const borrowedAmount = previousSnapshot ? previousSnapshot.borrowedAmount : BigInt(0);

  // Fetch claimable yield from contract
  const claimableYield = await fetchClaimableYield(context, chainId, facility, depositAsset);

  const assetDecimals = await getDepositAssetDecimals(context, depositAsset.id);

  // Create new snapshot
  const snapshot: FacilityAssetSnapshot = {
    id: snapshotId,
    chainId,
    block: BigInt(blockNumber),
    timestamp: BigInt(timestamp),
    facilitySnapshot_id: facilitySnapshot.id,
    facility_id: facility.id,
    depositAsset_id: depositAsset.id,
    totalDeposited,
    totalDepositedDecimal: toDecimal(totalDeposited, assetDecimals),
    pendingRedemption,
    pendingRedemptionDecimal: toDecimal(pendingRedemption, assetDecimals),
    borrowedAmount,
    borrowedAmountDecimal: toDecimal(borrowedAmount, assetDecimals),
    claimableYield,
    claimableYieldDecimal: toDecimal(claimableYield, assetDecimals),
  };

  context.FacilityAssetSnapshot.set(snapshot);

  // Update LatestSnapshot to include this new facility asset snapshot
  await updateLatestSnapshotFacilityAssets(
    context,
    chainId,
    facility.address as Hex,
    asset.address as Hex,
    snapshotId,
  );

  return snapshot;
}

/**
 * Update the LatestSnapshot to include the new facility snapshot
 */
async function updateLatestSnapshotFacilities(
  context: HandlerContext,
  chainId: number,
  facilityAddress: Hex,
  snapshotId: string,
): Promise<void> {
  const latestSnapshot = await getOrCreateLatestSnapshot(context, chainId);

  // Remove any existing snapshot for this facility
  const filteredIds = latestSnapshot.facilitySnapshotIds.filter((id) => {
    // Extract chainId and facility address from snapshot ID (format: chainId_blockNumber_facilityAddress)
    const parts = id.split("_");
    const existingFacilityAddress = parts[2];

    // We want to return IDs that are for different facilities
    return existingFacilityAddress.toLowerCase() !== facilityAddress.toLowerCase();
  });

  // Add the new snapshot ID
  const updatedSnapshot: LatestSnapshot = {
    ...latestSnapshot,
    facilitySnapshotIds: [...filteredIds, snapshotId],
  };

  context.LatestSnapshot.set(updatedSnapshot);
}

/**
 * Update the LatestSnapshot to include the new facility asset snapshot
 */
async function updateLatestSnapshotFacilityAssets(
  context: HandlerContext,
  chainId: number,
  facilityAddress: Hex,
  assetAddress: Hex,
  snapshotId: string,
): Promise<void> {
  const latestSnapshot = await getOrCreateLatestSnapshot(context, chainId);

  // Remove any existing snapshot for this facility/asset combo
  const filteredIds = latestSnapshot.facilityAssetSnapshotIds.filter((id) => {
    // Extract chainId, facility address, and asset address from snapshot ID (format: chainId_blockNumber_facilityAddress_assetAddress)
    const parts = id.split("_");
    const existingFacilityAddress = parts[2];
    const existingAssetAddress = parts[3];

    // We want to return IDs that are for different facility/asset combos
    return (
      existingFacilityAddress.toLowerCase() !== facilityAddress.toLowerCase() ||
      existingAssetAddress.toLowerCase() !== assetAddress.toLowerCase()
    );
  });

  // Add the new snapshot ID
  const updatedSnapshot: LatestSnapshot = {
    ...latestSnapshot,
    facilityAssetSnapshotIds: [...filteredIds, snapshotId],
  };

  context.LatestSnapshot.set(updatedSnapshot);
}

/**
 * Update facility asset deposited amount (positive delta for deposit, negative for withdrawal)
 */
export async function updateFacilityAssetDeposited(
  context: HandlerContext,
  chainId: number,
  blockNumber: number | bigint,
  timestamp: number | bigint,
  facility: DepositFacility,
  depositAsset: DepositAsset,
  delta: bigint,
): Promise<void> {
  // Get or create facility snapshot
  const facilitySnapshot = await getOrCreateFacilitySnapshot(
    context,
    chainId,
    blockNumber,
    timestamp,
    facility,
  );

  // Get or create facility asset snapshot
  const assetSnapshot = await getOrCreateFacilityAssetSnapshot(
    context,
    chainId,
    blockNumber,
    timestamp,
    facilitySnapshot,
    facility,
    depositAsset,
  );

  // Update totalDeposited
  const updatedTotalDeposited = assetSnapshot.totalDeposited + delta;
  const assetDecimals = await getDepositAssetDecimals(context, depositAsset.id);

  // Re-fetch claimable yield from contract
  const claimableYield = await fetchClaimableYield(context, chainId, facility, depositAsset);

  // Update and save snapshot
  const updatedSnapshot: FacilityAssetSnapshot = {
    ...assetSnapshot,
    totalDeposited: updatedTotalDeposited,
    totalDepositedDecimal: toDecimal(updatedTotalDeposited, assetDecimals),
    claimableYield,
    claimableYieldDecimal: toDecimal(claimableYield, assetDecimals),
  };
  context.FacilityAssetSnapshot.set(updatedSnapshot);
}

/**
 * Update facility asset pending redemption (positive for new redemption, negative for redeemed/cancelled)
 */
export async function updateFacilityAssetPendingRedemption(
  context: HandlerContext,
  chainId: number,
  blockNumber: number | bigint,
  timestamp: number | bigint,
  facility: DepositFacility,
  depositAsset: DepositAsset,
  delta: bigint,
): Promise<void> {
  // Get or create facility snapshot
  const facilitySnapshot = await getOrCreateFacilitySnapshot(
    context,
    chainId,
    blockNumber,
    timestamp,
    facility,
  );

  // Get or create facility asset snapshot
  const assetSnapshot = await getOrCreateFacilityAssetSnapshot(
    context,
    chainId,
    blockNumber,
    timestamp,
    facilitySnapshot,
    facility,
    depositAsset,
  );

  // Update pendingRedemption
  const updatedPendingRedemption = assetSnapshot.pendingRedemption + delta;
  const assetDecimals = await getDepositAssetDecimals(context, depositAsset.id);

  // Update and save snapshot
  const updatedSnapshot: FacilityAssetSnapshot = {
    ...assetSnapshot,
    pendingRedemption: updatedPendingRedemption,
    pendingRedemptionDecimal: toDecimal(updatedPendingRedemption, assetDecimals),
  };
  context.FacilityAssetSnapshot.set(updatedSnapshot);
}

/**
 * Update facility asset borrowed amount (positive for new loan, negative for repaid)
 */
export async function updateFacilityAssetBorrowedAmount(
  context: HandlerContext,
  chainId: number,
  blockNumber: number | bigint,
  timestamp: number | bigint,
  facility: DepositFacility,
  depositAsset: DepositAsset,
  delta: bigint,
): Promise<void> {
  // Get or create facility snapshot
  const facilitySnapshot = await getOrCreateFacilitySnapshot(
    context,
    chainId,
    blockNumber,
    timestamp,
    facility,
  );

  // Get or create facility asset snapshot
  const assetSnapshot = await getOrCreateFacilityAssetSnapshot(
    context,
    chainId,
    blockNumber,
    timestamp,
    facilitySnapshot,
    facility,
    depositAsset,
  );

  // Update borrowedAmount
  const updatedBorrowedAmount = assetSnapshot.borrowedAmount + delta;
  const assetDecimals = await getDepositAssetDecimals(context, depositAsset.id);

  // Update and save snapshot
  const updatedSnapshot: FacilityAssetSnapshot = {
    ...assetSnapshot,
    borrowedAmount: updatedBorrowedAmount,
    borrowedAmountDecimal: toDecimal(updatedBorrowedAmount, assetDecimals),
  };

  context.FacilityAssetSnapshot.set(updatedSnapshot);
}
