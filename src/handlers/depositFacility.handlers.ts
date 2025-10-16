/*
 * Event handlers for ConvertibleDepositFacility contract
 */
import {
  ConvertibleDepositFacility,
  type ConvertibleDepositFacility_AssetCommitCancelled,
  type ConvertibleDepositFacility_AssetCommitted,
  type ConvertibleDepositFacility_AssetCommitWithdrawn,
  type ConvertibleDepositFacility_AssetPeriodReclaimRateSet,
  type ConvertibleDepositFacility_ClaimedYield,
  type ConvertibleDepositFacility_ConvertedDeposit,
  type ConvertibleDepositFacility_ConvertedDeposits,
  type ConvertibleDepositFacility_CreatedDeposit,
  type ConvertibleDepositFacility_Disabled,
  type ConvertibleDepositFacility_Enabled,
  type ConvertibleDepositFacility_OperatorAuthorized,
  type ConvertibleDepositFacility_OperatorDeauthorized,
  type ConvertibleDepositFacility_Reclaimed,
} from "generated";
import type { Hex } from "viem";
import { fetchPositions, fetchUserPositionIds } from "../contracts/position";
import { getAssetDecimals, getDepositAsset, getDepositAssetPeriod } from "../entities/asset";
import {
  getOrCreateDepositFacility,
  getOrCreateDepositFacilityAsset,
  getOrCreateDepositFacilityAssetPeriod,
} from "../entities/depositFacility";
import { getOrCreateDepositor } from "../entities/depositor";
import { getOrCreatePosition } from "../entities/position";
import {
  getOrCreateDepositFacilityAssetSnapshot,
  getOrCreateDepositFacilitySnapshot,
  updateFacilityAssetDeposited,
} from "../entities/snapshot";
import { toBpsDecimal, toDecimal, toOhmDecimal } from "../utils/decimal";
import { buildEntityId, getBlockId, getPositionId } from "../utils/ids";

ConvertibleDepositFacility.AssetCommitCancelled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facilityAsset = await getOrCreateDepositFacilityAsset(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.asset as Hex,
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset as Hex);

  // Calculate committed amount
  const committedAmount = facilityAsset.committedAmount - event.params.amount;

  // Record event
  const entity: ConvertibleDepositFacility_AssetCommitCancelled = {
    id,
    facilityAsset_id: facilityAsset.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    operator: event.params.operator.toLowerCase(),
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
    committedAmount: committedAmount,
    committedAmountDecimal: toDecimal(committedAmount, assetDecimals),
  };
  context.ConvertibleDepositFacility_AssetCommitCancelled.set(entity);

  // Update facility asset amount
  const updatedFacilityAsset = {
    ...facilityAsset,
    committedAmount: committedAmount,
    committedAmountDecimal: toDecimal(committedAmount, assetDecimals),
  };
  context.DepositFacilityAsset.set(updatedFacilityAsset);
});

ConvertibleDepositFacility.AssetCommitWithdrawn.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facilityAsset = await getOrCreateDepositFacilityAsset(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.asset as Hex,
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset as Hex);

  // Calculate committed amount
  const committedAmount = facilityAsset.committedAmount - event.params.amount;

  // Record event
  const entity: ConvertibleDepositFacility_AssetCommitWithdrawn = {
    id,
    facilityAsset_id: facilityAsset.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    operator: event.params.operator.toLowerCase(),
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
    committedAmount: committedAmount,
    committedAmountDecimal: toDecimal(committedAmount, assetDecimals),
  };
  context.ConvertibleDepositFacility_AssetCommitWithdrawn.set(entity);

  // Update facility asset amount
  const updatedFacilityAsset = {
    ...facilityAsset,
    committedAmount: committedAmount,
    committedAmountDecimal: toDecimal(committedAmount, assetDecimals),
  };
  context.DepositFacilityAsset.set(updatedFacilityAsset);
});

ConvertibleDepositFacility.AssetCommitted.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facilityAsset = await getOrCreateDepositFacilityAsset(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.asset as Hex,
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset as Hex);

  // Calculate committed amount
  const committedAmount = facilityAsset.committedAmount + event.params.amount;

  // Record event
  const entity: ConvertibleDepositFacility_AssetCommitted = {
    id,
    facilityAsset_id: facilityAsset.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    operator: event.params.operator.toLowerCase(),
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
    committedAmount: committedAmount,
    committedAmountDecimal: toDecimal(committedAmount, assetDecimals),
  };
  context.ConvertibleDepositFacility_AssetCommitted.set(entity);

  // Update facility asset amount
  const updatedFacilityAsset = {
    ...facilityAsset,
    committedAmount: committedAmount,
    committedAmountDecimal: toDecimal(committedAmount, assetDecimals),
  };
  context.DepositFacilityAsset.set(updatedFacilityAsset);
});

ConvertibleDepositFacility.AssetPeriodReclaimRateSet.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facilityAssetPeriod = await getOrCreateDepositFacilityAssetPeriod(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.asset as Hex,
    Number(event.params.depositPeriod),
  );

  // Record event
  const entity: ConvertibleDepositFacility_AssetPeriodReclaimRateSet = {
    id,
    facilityAssetPeriod_id: facilityAssetPeriod.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    reclaimRate: event.params.reclaimRate,
    reclaimRateDecimal: toBpsDecimal(event.params.reclaimRate),
  };
  context.ConvertibleDepositFacility_AssetPeriodReclaimRateSet.set(entity);

  // Update facility asset period reclaim rate
  const updatedFacilityAssetPeriod = {
    ...facilityAssetPeriod,
    reclaimRate: event.params.reclaimRate,
    reclaimRateDecimal: toBpsDecimal(event.params.reclaimRate),
  };
  context.DepositFacilityAssetPeriod.set(updatedFacilityAssetPeriod);
});

ConvertibleDepositFacility.ClaimedYield.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facilityAsset = await getOrCreateDepositFacilityAsset(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.asset as Hex,
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset as Hex);

  // Record event
  const entity: ConvertibleDepositFacility_ClaimedYield = {
    id,
    facilityAsset_id: facilityAsset.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
  };
  context.ConvertibleDepositFacility_ClaimedYield.set(entity);

  // Create/update facility asset snapshot to refresh claimable yield
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );
  const depositAsset = await getDepositAsset(context, facilityAsset.depositAsset_id);
  const facilitySnapshot = await getOrCreateDepositFacilitySnapshot(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
  );
  await getOrCreateDepositFacilityAssetSnapshot(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facilitySnapshot,
    facility,
    depositAsset,
  );
});

ConvertibleDepositFacility.ConvertedDeposit.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const depositor = await getOrCreateDepositor(
    context,
    event.chainId,
    event.params.depositor as Hex,
  );
  const facilityAssetPeriod = await getOrCreateDepositFacilityAssetPeriod(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.asset as Hex,
    Number(event.params.periodMonths),
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset as Hex);

  // Create record for the original event
  const entity: ConvertibleDepositFacility_ConvertedDeposits = {
    id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    depositAmount: event.params.depositAmount,
    depositAmountDecimal: toDecimal(event.params.depositAmount, assetDecimals),
    convertedAmount: event.params.convertedAmount,
    convertedAmountDecimal: toOhmDecimal(event.params.convertedAmount),
  };
  context.ConvertibleDepositFacility_ConvertedDeposits.set(entity);

  // Update positions of depositor for this asset period
  const contractPositionIds = await context.effect(fetchUserPositionIds, {
    chainId: event.chainId,
    userAddress: event.params.depositor as Hex,
  });
  const contractPositions = await context.effect(fetchPositions, {
    chainId: event.chainId,
    positionIds: contractPositionIds,
  });

  // Update positions of depositor for this asset period
  for (let i = 0; i < contractPositionIds.length; i++) {
    const contractPositionId = contractPositionIds[i];
    const contractPosition = contractPositions[i];
    const recordPositionId = getPositionId(event.chainId, contractPositionId);
    const recordPosition = await context.ConvertibleDepositPosition.get(recordPositionId);

    if (!recordPosition) continue;
    if (recordPosition.assetPeriod_id !== facilityAssetPeriod.depositAssetPeriod_id) continue;

    // Skip if the position's remaining amount and the contract value are the same
    const depositConvertedAmount =
      recordPosition.remainingAmount - contractPosition.remainingDeposit;
    if (depositConvertedAmount === 0n) continue;

    // Calculate the amount converted
    const convertedAmount =
      (depositConvertedAmount * BigInt(1e9)) / contractPosition.conversionPrice;

    // Create record for the converted deposit
    const convertedDepositEntity: ConvertibleDepositFacility_ConvertedDeposit = {
      id: buildEntityId([event.chainId, event.block.number, event.logIndex, contractPositionId]),
      chainId: event.chainId,
      txHash: event.transaction.hash,
      block: BigInt(event.block.number),
      timestamp: BigInt(event.block.timestamp),
      position_id: recordPositionId,
      facilityAssetPeriod_id: facilityAssetPeriod.id,
      depositor_id: depositor.id,
      depositAmount: depositConvertedAmount,
      depositAmountDecimal: toDecimal(depositConvertedAmount, assetDecimals),
      convertedAmount: convertedAmount,
      convertedAmountDecimal: toOhmDecimal(convertedAmount),
      event_id: entity.id,
    };
    context.ConvertibleDepositFacility_ConvertedDeposit.set(convertedDepositEntity);

    // Update the position record with the new remaining amount
    const updatedPosition = {
      ...recordPosition,
      remainingAmount: contractPosition.remainingDeposit,
      remainingAmountDecimal: toDecimal(contractPosition.remainingDeposit, assetDecimals),
    };
    context.ConvertibleDepositPosition.set(updatedPosition);
  }

  // Update facility asset snapshot with withdrawal (negative delta)
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );
  const depositAssetPeriod = await getDepositAssetPeriod(
    context,
    facilityAssetPeriod.depositAssetPeriod_id,
  );
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  await updateFacilityAssetDeposited(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    -event.params.depositAmount, // Negative for withdrawal
  );
});

ConvertibleDepositFacility.CreatedDeposit.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facilityAssetPeriod = await getOrCreateDepositFacilityAssetPeriod(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.asset as Hex,
    Number(event.params.periodMonths),
  );
  const depositor = await getOrCreateDepositor(
    context,
    event.chainId,
    event.params.depositor as Hex,
  );
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.asset as Hex,
    Number(event.params.periodMonths),
    event.params.positionId,
    event.params.depositor as Hex,
    event.transaction.hash as Hex,
    BigInt(event.block.number),
    BigInt(event.block.timestamp),
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset as Hex);

  // Record event
  const entity: ConvertibleDepositFacility_CreatedDeposit = {
    id,
    facilityAssetPeriod_id: facilityAssetPeriod.id,
    depositor_id: depositor.id,
    position_id: position.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    depositAmount: event.params.depositAmount,
    depositAmountDecimal: toDecimal(event.params.depositAmount, assetDecimals),
  };
  context.ConvertibleDepositFacility_CreatedDeposit.set(entity);

  // Update position with initial amount
  const updatedPosition = {
    ...position,
    initialAmount: event.params.depositAmount,
    initialAmountDecimal: toDecimal(event.params.depositAmount, assetDecimals),
    remainingAmount: event.params.depositAmount,
    remainingAmountDecimal: toDecimal(event.params.depositAmount, assetDecimals),
  };
  context.ConvertibleDepositPosition.set(updatedPosition);

  // Update facility asset snapshot with deposit
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );
  const depositAssetPeriod = await getDepositAssetPeriod(
    context,
    facilityAssetPeriod.depositAssetPeriod_id,
  );
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  await updateFacilityAssetDeposited(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    event.params.depositAmount,
  );
});

ConvertibleDepositFacility.Disabled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );

  // Record event
  const entity: ConvertibleDepositFacility_Disabled = {
    id,
    facility_id: facility.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.ConvertibleDepositFacility_Disabled.set(entity);

  // Update facility status
  const updatedFacility = {
    ...facility,
    enabled: false,
  };
  context.DepositFacility.set(updatedFacility);
});

ConvertibleDepositFacility.Enabled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );

  // Record event
  const entity: ConvertibleDepositFacility_Enabled = {
    id,
    facility_id: facility.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.ConvertibleDepositFacility_Enabled.set(entity);

  // Update facility status
  const updatedFacility = {
    ...facility,
    enabled: true,
  };
  context.DepositFacility.set(updatedFacility);
});

ConvertibleDepositFacility.OperatorAuthorized.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );

  // Record event
  const entity: ConvertibleDepositFacility_OperatorAuthorized = {
    id,
    facility_id: facility.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    operator: event.params.operator.toLowerCase(),
  };
  context.ConvertibleDepositFacility_OperatorAuthorized.set(entity);
});

ConvertibleDepositFacility.OperatorDeauthorized.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );

  // Record event
  const entity: ConvertibleDepositFacility_OperatorDeauthorized = {
    id,
    facility_id: facility.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    operator: event.params.operator.toLowerCase(),
  };
  context.ConvertibleDepositFacility_OperatorDeauthorized.set(entity);
});

ConvertibleDepositFacility.Reclaimed.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facilityAssetPeriod = await getOrCreateDepositFacilityAssetPeriod(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.depositToken as Hex,
    Number(event.params.depositPeriod),
  );
  const depositor = await getOrCreateDepositor(context, event.chainId, event.params.user as Hex);
  const assetDecimals = await getAssetDecimals(
    context,
    event.chainId,
    event.params.depositToken as Hex,
  );

  // Record event
  const entity: ConvertibleDepositFacility_Reclaimed = {
    id,
    facilityAssetPeriod_id: facilityAssetPeriod.id,
    depositor_id: depositor.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    reclaimedAmount: event.params.reclaimedAmount,
    reclaimedAmountDecimal: toDecimal(event.params.reclaimedAmount, assetDecimals),
    forfeitedAmount: event.params.forfeitedAmount,
    forfeitedAmountDecimal: toDecimal(event.params.forfeitedAmount, assetDecimals),
  };
  context.ConvertibleDepositFacility_Reclaimed.set(entity);

  // Update facility asset snapshot with withdrawal (negative delta)
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );
  const depositAssetPeriod = await getDepositAssetPeriod(
    context,
    facilityAssetPeriod.depositAssetPeriod_id,
  );
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  await updateFacilityAssetDeposited(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    -event.params.reclaimedAmount, // Negative for withdrawal
  );
});

// TODO add split event
