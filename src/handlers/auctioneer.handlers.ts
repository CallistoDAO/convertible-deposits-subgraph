/*
 * Event handlers for ConvertibleDepositAuctioneer contract
 */
import {
  ConvertibleDepositAuctioneer,
  type ConvertibleDepositAuctioneer_AuctionParametersUpdated,
  type ConvertibleDepositAuctioneer_AuctionResult,
  type ConvertibleDepositAuctioneer_AuctionTrackingPeriodUpdated,
  type ConvertibleDepositAuctioneer_Bid,
  type ConvertibleDepositAuctioneer_DepositPeriodDisabled,
  type ConvertibleDepositAuctioneer_DepositPeriodDisableQueued,
  type ConvertibleDepositAuctioneer_DepositPeriodEnabled,
  type ConvertibleDepositAuctioneer_DepositPeriodEnableQueued,
  type ConvertibleDepositAuctioneer_Disabled,
  type ConvertibleDepositAuctioneer_Enabled,
  type ConvertibleDepositAuctioneer_TickStepUpdated,
} from "generated";
import { fetchAuctioneerCurrentTick } from "../contracts/auctioneer";
import {
  getDepositAssetDecimals,
  getDepositAssetPeriod,
  getDepositAssetPeriodDecimals,
  getOrCreateDepositAsset,
} from "../entities/asset";
import { getOrCreateAuctioneer, getOrCreateAuctioneerDepositPeriod } from "../entities/auctioneer";
import { getOrCreateDepositFacility } from "../entities/depositFacility";
import { getOrCreateDepositor } from "../entities/depositor";
import { getOrCreatePosition } from "../entities/position";
import { toBpsDecimal, toDecimal, toOhmDecimal } from "../utils/decimal";
import { getBlockId } from "../utils/ids";

ConvertibleDepositAuctioneer.AuctionParametersUpdated.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);
  const depositAsset = await getOrCreateDepositAsset(
    context,
    event.chainId,
    event.params.depositAsset,
  );
  const assetDecimals = await getDepositAssetDecimals(context, depositAsset.id);

  // Calculate decimals
  const targetDecimal = toOhmDecimal(event.params.newTarget);
  const tickSizeDecimal = toOhmDecimal(event.params.newTickSize);
  const minPriceDecimal = toDecimal(event.params.newMinPrice, assetDecimals);

  // Record the AuctionParametersUpdated event
  const entity: ConvertibleDepositAuctioneer_AuctionParametersUpdated = {
    id,
    auctioneer_id: auctioneer.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    target: event.params.newTarget,
    targetDecimal,
    tickSize: event.params.newTickSize,
    tickSizeDecimal,
    minPrice: event.params.newMinPrice,
    minPriceDecimal,
  };
  context.ConvertibleDepositAuctioneer_AuctionParametersUpdated.set(entity);

  // Update auctioneer with new parameters
  const updatedAuctioneer = {
    ...auctioneer,
    target: event.params.newTarget,
    targetDecimal,
    tickSize: event.params.newTickSize,
    tickSizeDecimal,
    minPrice: event.params.newMinPrice,
    minPriceDecimal,
  };
  context.Auctioneer.set(updatedAuctioneer);
});

ConvertibleDepositAuctioneer.AuctionResult.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);

  // Calculate decimals
  const ohmConvertibleDecimal = toOhmDecimal(event.params.ohmConvertible);
  const targetDecimal = toOhmDecimal(event.params.target);

  const entity: ConvertibleDepositAuctioneer_AuctionResult = {
    id,
    auctioneer_id: auctioneer.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    ohmConvertible: event.params.ohmConvertible,
    ohmConvertibleDecimal,
    target: event.params.target,
    targetDecimal,
    periodIndex: event.params.periodIndex,
  };
  context.ConvertibleDepositAuctioneer_AuctionResult.set(entity);
});

ConvertibleDepositAuctioneer.AuctionTrackingPeriodUpdated.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);

  // Record the AuctionTrackingPeriodUpdated event
  const entity: ConvertibleDepositAuctioneer_AuctionTrackingPeriodUpdated = {
    id,
    auctioneer_id: auctioneer.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    auctionTrackingPeriod: event.params.newAuctionTrackingPeriod,
  };

  context.ConvertibleDepositAuctioneer_AuctionTrackingPeriodUpdated.set(entity);

  // Update auctioneer with new tracking period
  const updatedAuctioneer = {
    ...auctioneer,
    auctionTrackingPeriod: Number(event.params.newAuctionTrackingPeriod),
  };
  context.Auctioneer.set(updatedAuctioneer);
});

ConvertibleDepositAuctioneer.Bid.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);
  const facility = await getOrCreateDepositFacility(context, event.chainId, event.srcAddress);
  const auctioneerDepositPeriod = await getOrCreateAuctioneerDepositPeriod(
    context,
    event.chainId,
    auctioneer,
    event.params.depositAsset,
    Number(event.params.depositPeriod),
  );
  const depositAssetPeriod = await getDepositAssetPeriod(
    context,
    auctioneerDepositPeriod.depositAssetPeriod_id,
  );
  const depositor = await getOrCreateDepositor(context, event.chainId, event.params.bidder);
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    facility.address,
    event.params.depositAsset,
    depositAssetPeriod.periodMonths,
    event.params.positionId,
    event.params.bidder,
    event.transaction.hash,
    BigInt(event.block.number),
    BigInt(event.block.timestamp),
  );

  const assetDecimals = await getDepositAssetPeriodDecimals(context, depositAssetPeriod.id);

  // Fetch tick data from contract
  const tickData = await context.effect(fetchAuctioneerCurrentTick, {
    chainId: event.chainId,
    address: event.srcAddress,
    depositPeriod: Number(event.params.depositPeriod),
  });

  // Calculate decimals
  const depositAmountDecimal = toDecimal(event.params.depositAmount, assetDecimals);
  const convertedAmountDecimal = toOhmDecimal(event.params.convertedAmount);
  const tickCapacity = tickData.capacity;
  const tickCapacityDecimal = toOhmDecimal(tickCapacity);
  const tickPrice = tickData.price;
  const tickPriceDecimal = toDecimal(tickPrice, assetDecimals);

  // Record the Bid
  const entity: ConvertibleDepositAuctioneer_Bid = {
    id,
    auctioneerDepositPeriod_id: auctioneerDepositPeriod.id,
    depositor_id: depositor.id,
    position_id: position.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    depositAmount: event.params.depositAmount,
    depositAmountDecimal,
    convertedAmount: event.params.convertedAmount,
    convertedAmountDecimal,
    tickCapacity,
    tickCapacityDecimal,
    tickPrice,
    tickPriceDecimal,
  };
  context.ConvertibleDepositAuctioneer_Bid.set(entity);

  // Update the AuctioneerDepositPeriod with the new tick data
  const updatedAuctioneerDepositPeriod = {
    ...auctioneerDepositPeriod,
    currentTickCapacity: tickData.capacity,
    currentTickCapacityDecimal: toOhmDecimal(tickData.capacity),
    currentTickPrice: tickData.price,
    currentTickPriceDecimal: toDecimal(tickPrice, assetDecimals),
  };
  context.AuctioneerDepositPeriod.set(updatedAuctioneerDepositPeriod);
});

ConvertibleDepositAuctioneer.DepositPeriodDisableQueued.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);
  const auctioneerDepositPeriod = await getOrCreateAuctioneerDepositPeriod(
    context,
    event.chainId,
    auctioneer,
    event.params.depositAsset,
    Number(event.params.depositPeriod),
  );

  // Record the DepositPeriodDisableQueued event
  const entity: ConvertibleDepositAuctioneer_DepositPeriodDisableQueued = {
    id,
    auctioneerDepositPeriod_id: auctioneerDepositPeriod.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.ConvertibleDepositAuctioneer_DepositPeriodDisableQueued.set(entity);
});

ConvertibleDepositAuctioneer.DepositPeriodDisabled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);
  const auctioneerDepositPeriod = await getOrCreateAuctioneerDepositPeriod(
    context,
    event.chainId,
    auctioneer,
    event.params.depositAsset,
    Number(event.params.depositPeriod),
  );

  // Record the DepositPeriodDisabled event
  const entity: ConvertibleDepositAuctioneer_DepositPeriodDisabled = {
    id,
    auctioneerDepositPeriod_id: auctioneerDepositPeriod.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.ConvertibleDepositAuctioneer_DepositPeriodDisabled.set(entity);

  // Update the AuctioneerDepositPeriod with the new status
  const updatedAuctioneerDepositPeriod = {
    ...auctioneerDepositPeriod,
    enabled: false,
  };
  context.AuctioneerDepositPeriod.set(updatedAuctioneerDepositPeriod);
});

ConvertibleDepositAuctioneer.DepositPeriodEnableQueued.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);
  const auctioneerDepositPeriod = await getOrCreateAuctioneerDepositPeriod(
    context,
    event.chainId,
    auctioneer,
    event.params.depositAsset,
    Number(event.params.depositPeriod),
  );

  // Record the DepositPeriodEnableQueued event
  const entity: ConvertibleDepositAuctioneer_DepositPeriodEnableQueued = {
    id,
    auctioneerDepositPeriod_id: auctioneerDepositPeriod.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.ConvertibleDepositAuctioneer_DepositPeriodEnableQueued.set(entity);
});

ConvertibleDepositAuctioneer.DepositPeriodEnabled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);
  const auctioneerDepositPeriod = await getOrCreateAuctioneerDepositPeriod(
    context,
    event.chainId,
    auctioneer,
    event.params.depositAsset,
    Number(event.params.depositPeriod),
  );

  // Record the DepositPeriodEnabled event
  const entity: ConvertibleDepositAuctioneer_DepositPeriodEnabled = {
    id,
    auctioneerDepositPeriod_id: auctioneerDepositPeriod.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.ConvertibleDepositAuctioneer_DepositPeriodEnabled.set(entity);

  // Update the AuctioneerDepositPeriod with the new status
  const updatedAuctioneerDepositPeriod = {
    ...auctioneerDepositPeriod,
    enabled: true,
  };
  context.AuctioneerDepositPeriod.set(updatedAuctioneerDepositPeriod);
});

ConvertibleDepositAuctioneer.Disabled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);

  // Record the Disabled event
  const entity: ConvertibleDepositAuctioneer_Disabled = {
    id,
    auctioneer_id: auctioneer.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.ConvertibleDepositAuctioneer_Disabled.set(entity);

  // Update auctioneer status
  const updatedAuctioneer = {
    ...auctioneer,
    enabled: false,
  };
  context.Auctioneer.set(updatedAuctioneer);
});

ConvertibleDepositAuctioneer.Enabled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);

  // Record the Enabled event
  const entity: ConvertibleDepositAuctioneer_Enabled = {
    id,
    auctioneer_id: auctioneer.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };

  context.ConvertibleDepositAuctioneer_Enabled.set(entity);

  // Update auctioneer status
  const updatedAuctioneer = {
    ...auctioneer,
    enabled: true,
  };
  context.Auctioneer.set(updatedAuctioneer);
});

ConvertibleDepositAuctioneer.TickStepUpdated.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);
  const auctioneer = await getOrCreateAuctioneer(context, event.chainId, event.srcAddress);

  // Calculate decimals
  const tickStepDecimal = toBpsDecimal(event.params.newTickStep);

  // Record the TickStepUpdated event
  const entity: ConvertibleDepositAuctioneer_TickStepUpdated = {
    id,
    auctioneer_id: auctioneer.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    newTickStep: event.params.newTickStep,
    newTickStepDecimal: tickStepDecimal,
  };
  context.ConvertibleDepositAuctioneer_TickStepUpdated.set(entity);

  // Update auctioneer with new tick step
  const updatedAuctioneer = {
    ...auctioneer,
    tickStep: event.params.newTickStep,
    tickStepDecimal,
  };
  context.Auctioneer.set(updatedAuctioneer);
});
