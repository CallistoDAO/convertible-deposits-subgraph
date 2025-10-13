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
  type ConvertibleDepositFacility_CreatedDeposit,
  type ConvertibleDepositFacility_Disabled,
  type ConvertibleDepositFacility_Enabled,
  type ConvertibleDepositFacility_OperatorAuthorized,
  type ConvertibleDepositFacility_OperatorDeauthorized,
  type ConvertibleDepositFacility_Reclaimed,
} from "generated";
import { fetchUserPositionIds } from "../contracts/position";
import { getAssetDecimals } from "../entities/asset";
import {
  getOrCreateDepositFacility,
  getOrCreateDepositFacilityAsset,
  getOrCreateDepositFacilityAssetPeriod,
} from "../entities/depositFacility";
import { getOrCreateDepositor } from "../entities/depositor";
import { getOrCreatePosition, updatePositionFromContract } from "../entities/position";
import { getOrCreateReceiptToken } from "../entities/receiptToken";
import { toBpsDecimal, toDecimal, toOhmDecimal } from "../utils/decimal";
import { getBlockId, getPositionId } from "../utils/ids";

ConvertibleDepositFacility.AssetCommitCancelled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facilityAsset = await getOrCreateDepositFacilityAsset(
    context,
    event.chainId,
    event.srcAddress,
    event.params.asset,
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset);

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
    event.srcAddress,
    event.params.asset,
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset);

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
    event.srcAddress,
    event.params.asset,
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset);

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
    event.srcAddress,
    event.params.asset,
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
    event.srcAddress,
    event.params.asset,
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset);

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
});

ConvertibleDepositFacility.ConvertedDeposit.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const depositor = await getOrCreateDepositor(context, event.chainId, event.params.depositor);
  const facilityAssetPeriod = await getOrCreateDepositFacilityAssetPeriod(
    context,
    event.chainId,
    event.srcAddress,
    event.params.asset,
    Number(event.params.periodMonths),
  );
  const receiptToken = await getOrCreateReceiptToken(
    context,
    event.chainId,
    event.srcAddress,
    event.params.asset,
    Number(event.params.periodMonths),
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset);

  // Record event
  const entity: ConvertibleDepositFacility_ConvertedDeposit = {
    id,
    facilityAssetPeriod_id: facilityAssetPeriod.id,
    receiptToken_id: receiptToken.id,
    depositor_id: depositor.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    depositAmount: event.params.depositAmount,
    depositAmountDecimal: toDecimal(event.params.depositAmount, assetDecimals),
    convertedAmount: event.params.convertedAmount,
    convertedAmountDecimal: toOhmDecimal(event.params.convertedAmount),
  };
  context.ConvertibleDepositFacility_ConvertedDeposit.set(entity);

  // Update positions of depositor for this asset period
  const userPositionIds = await context.effect(fetchUserPositionIds, {
    chainId: event.chainId,
    userAddress: event.params.depositor,
  });

  // Update positions of depositor for this asset period
  for (const positionId of userPositionIds) {
    const positionRecordId = getPositionId(event.chainId, positionId);
    const position = await context.ConvertibleDepositPosition.get(positionRecordId);

    if (!position) continue;
    if (position.assetPeriod_id !== facilityAssetPeriod.depositAssetPeriod_id) continue;

    await updatePositionFromContract(context, positionRecordId, assetDecimals);
  }
});

ConvertibleDepositFacility.CreatedDeposit.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facilityAssetPeriod = await getOrCreateDepositFacilityAssetPeriod(
    context,
    event.chainId,
    event.srcAddress,
    event.params.asset,
    Number(event.params.periodMonths),
  );
  const depositor = await getOrCreateDepositor(context, event.chainId, event.params.depositor);
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    event.srcAddress,
    event.params.asset,
    Number(event.params.periodMonths),
    event.params.positionId,
    event.params.depositor,
    event.transaction.hash,
    BigInt(event.block.number),
    BigInt(event.block.timestamp),
  );
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.asset);

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
});

ConvertibleDepositFacility.Disabled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const facility = await getOrCreateDepositFacility(context, event.chainId, event.srcAddress);

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
  const facility = await getOrCreateDepositFacility(context, event.chainId, event.srcAddress);

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
  const facility = await getOrCreateDepositFacility(context, event.chainId, event.srcAddress);

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
  const facility = await getOrCreateDepositFacility(context, event.chainId, event.srcAddress);

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
    event.srcAddress,
    event.params.depositToken,
    Number(event.params.depositPeriod),
  );
  const depositor = await getOrCreateDepositor(context, event.chainId, event.params.user);
  const assetDecimals = await getAssetDecimals(context, event.chainId, event.params.depositToken);

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
});

// TODO add split event
