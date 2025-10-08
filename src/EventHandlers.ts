/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ConvertibleDepositAuctioneer,
  ConvertibleDepositAuctioneer_AuctionParametersUpdated,
  ConvertibleDepositAuctioneer_AuctionResult,
  ConvertibleDepositAuctioneer_AuctionTrackingPeriodUpdated,
  ConvertibleDepositAuctioneer_Bid,
  ConvertibleDepositAuctioneer_DepositPeriodDisableQueued,
  ConvertibleDepositAuctioneer_DepositPeriodDisabled,
  ConvertibleDepositAuctioneer_DepositPeriodEnableQueued,
  ConvertibleDepositAuctioneer_DepositPeriodEnabled,
  ConvertibleDepositAuctioneer_Disabled,
  ConvertibleDepositAuctioneer_Enabled,
  ConvertibleDepositAuctioneer_TickStepUpdated,
  ConvertibleDepositFacility,
  ConvertibleDepositFacility_AssetCommitCancelled,
  ConvertibleDepositFacility_AssetCommitWithdrawn,
  ConvertibleDepositFacility_AssetCommitted,
  ConvertibleDepositFacility_AssetPeriodReclaimRateSet,
  ConvertibleDepositFacility_ClaimedYield,
  ConvertibleDepositFacility_ConvertedDeposit,
  ConvertibleDepositFacility_CreatedDeposit,
  ConvertibleDepositFacility_Disabled,
  ConvertibleDepositFacility_Enabled,
  ConvertibleDepositFacility_OperatorAuthorized,
  ConvertibleDepositFacility_OperatorDeauthorized,
  ConvertibleDepositFacility_Reclaimed,
  DepositRedemptionVault,
  DepositRedemptionVault_AnnualInterestRateSet,
  DepositRedemptionVault_ClaimDefaultRewardPercentageSet,
  DepositRedemptionVault_Disabled,
  DepositRedemptionVault_Enabled,
  DepositRedemptionVault_FacilityAuthorized,
  DepositRedemptionVault_FacilityDeauthorized,
  DepositRedemptionVault_LoanCreated,
  DepositRedemptionVault_LoanDefaulted,
  DepositRedemptionVault_LoanExtended,
  DepositRedemptionVault_LoanRepaid,
  DepositRedemptionVault_MaxBorrowPercentageSet,
  DepositRedemptionVault_RedemptionCancelled,
  DepositRedemptionVault_RedemptionFinished,
  DepositRedemptionVault_RedemptionStarted,
} from "generated";

ConvertibleDepositAuctioneer.AuctionParametersUpdated.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_AuctionParametersUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositAsset: event.params.depositAsset,
    newTarget: event.params.newTarget,
    newTickSize: event.params.newTickSize,
    newMinPrice: event.params.newMinPrice,
  };

  context.ConvertibleDepositAuctioneer_AuctionParametersUpdated.set(entity);
});

ConvertibleDepositAuctioneer.AuctionResult.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_AuctionResult = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositAsset: event.params.depositAsset,
    ohmConvertible: event.params.ohmConvertible,
    target: event.params.target,
    periodIndex: event.params.periodIndex,
  };

  context.ConvertibleDepositAuctioneer_AuctionResult.set(entity);
});

ConvertibleDepositAuctioneer.AuctionTrackingPeriodUpdated.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_AuctionTrackingPeriodUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositAsset: event.params.depositAsset,
    newAuctionTrackingPeriod: event.params.newAuctionTrackingPeriod,
  };

  context.ConvertibleDepositAuctioneer_AuctionTrackingPeriodUpdated.set(entity);
});

ConvertibleDepositAuctioneer.Bid.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_Bid = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    bidder: event.params.bidder,
    depositAsset: event.params.depositAsset,
    depositPeriod: event.params.depositPeriod,
    depositAmount: event.params.depositAmount,
    convertedAmount: event.params.convertedAmount,
    positionId: event.params.positionId,
  };

  context.ConvertibleDepositAuctioneer_Bid.set(entity);
});

ConvertibleDepositAuctioneer.DepositPeriodDisableQueued.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_DepositPeriodDisableQueued = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositAsset: event.params.depositAsset,
    depositPeriod: event.params.depositPeriod,
  };

  context.ConvertibleDepositAuctioneer_DepositPeriodDisableQueued.set(entity);
});

ConvertibleDepositAuctioneer.DepositPeriodDisabled.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_DepositPeriodDisabled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositAsset: event.params.depositAsset,
    depositPeriod: event.params.depositPeriod,
  };

  context.ConvertibleDepositAuctioneer_DepositPeriodDisabled.set(entity);
});

ConvertibleDepositAuctioneer.DepositPeriodEnableQueued.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_DepositPeriodEnableQueued = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositAsset: event.params.depositAsset,
    depositPeriod: event.params.depositPeriod,
  };

  context.ConvertibleDepositAuctioneer_DepositPeriodEnableQueued.set(entity);
});

ConvertibleDepositAuctioneer.DepositPeriodEnabled.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_DepositPeriodEnabled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositAsset: event.params.depositAsset,
    depositPeriod: event.params.depositPeriod,
  };

  context.ConvertibleDepositAuctioneer_DepositPeriodEnabled.set(entity);
});

ConvertibleDepositAuctioneer.Disabled.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_Disabled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
  };

  context.ConvertibleDepositAuctioneer_Disabled.set(entity);
});

ConvertibleDepositAuctioneer.Enabled.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_Enabled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
  };

  context.ConvertibleDepositAuctioneer_Enabled.set(entity);
});

ConvertibleDepositAuctioneer.TickStepUpdated.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositAuctioneer_TickStepUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositAsset: event.params.depositAsset,
    newTickStep: event.params.newTickStep,
  };

  context.ConvertibleDepositAuctioneer_TickStepUpdated.set(entity);
});

ConvertibleDepositFacility.AssetCommitCancelled.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_AssetCommitCancelled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    asset: event.params.asset,
    operator: event.params.operator,
    amount: event.params.amount,
  };

  context.ConvertibleDepositFacility_AssetCommitCancelled.set(entity);
});

ConvertibleDepositFacility.AssetCommitWithdrawn.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_AssetCommitWithdrawn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    asset: event.params.asset,
    operator: event.params.operator,
    amount: event.params.amount,
  };

  context.ConvertibleDepositFacility_AssetCommitWithdrawn.set(entity);
});

ConvertibleDepositFacility.AssetCommitted.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_AssetCommitted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    asset: event.params.asset,
    operator: event.params.operator,
    amount: event.params.amount,
  };

  context.ConvertibleDepositFacility_AssetCommitted.set(entity);
});

ConvertibleDepositFacility.AssetPeriodReclaimRateSet.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_AssetPeriodReclaimRateSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    asset: event.params.asset,
    depositPeriod: event.params.depositPeriod,
    reclaimRate: event.params.reclaimRate,
  };

  context.ConvertibleDepositFacility_AssetPeriodReclaimRateSet.set(entity);
});

ConvertibleDepositFacility.ClaimedYield.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_ClaimedYield = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    asset: event.params.asset,
    amount: event.params.amount,
  };

  context.ConvertibleDepositFacility_ClaimedYield.set(entity);
});

ConvertibleDepositFacility.ConvertedDeposit.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_ConvertedDeposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    asset: event.params.asset,
    depositor: event.params.depositor,
    periodMonths: event.params.periodMonths,
    depositAmount: event.params.depositAmount,
    convertedAmount: event.params.convertedAmount,
  };

  context.ConvertibleDepositFacility_ConvertedDeposit.set(entity);
});

ConvertibleDepositFacility.CreatedDeposit.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_CreatedDeposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    asset: event.params.asset,
    depositor: event.params.depositor,
    positionId: event.params.positionId,
    periodMonths: event.params.periodMonths,
    depositAmount: event.params.depositAmount,
  };

  context.ConvertibleDepositFacility_CreatedDeposit.set(entity);
});

ConvertibleDepositFacility.Disabled.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_Disabled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
  };

  context.ConvertibleDepositFacility_Disabled.set(entity);
});

ConvertibleDepositFacility.Enabled.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_Enabled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
  };

  context.ConvertibleDepositFacility_Enabled.set(entity);
});

ConvertibleDepositFacility.OperatorAuthorized.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_OperatorAuthorized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    operator: event.params.operator,
  };

  context.ConvertibleDepositFacility_OperatorAuthorized.set(entity);
});

ConvertibleDepositFacility.OperatorDeauthorized.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_OperatorDeauthorized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    operator: event.params.operator,
  };

  context.ConvertibleDepositFacility_OperatorDeauthorized.set(entity);
});

ConvertibleDepositFacility.Reclaimed.handler(async ({ event, context }) => {
  const entity: ConvertibleDepositFacility_Reclaimed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    depositToken: event.params.depositToken,
    depositPeriod: event.params.depositPeriod,
    reclaimedAmount: event.params.reclaimedAmount,
    forfeitedAmount: event.params.forfeitedAmount,
  };

  context.ConvertibleDepositFacility_Reclaimed.set(entity);
});

DepositRedemptionVault.AnnualInterestRateSet.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_AnnualInterestRateSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    asset: event.params.asset,
    facility: event.params.facility,
    rate: event.params.rate,
  };

  context.DepositRedemptionVault_AnnualInterestRateSet.set(entity);
});

DepositRedemptionVault.ClaimDefaultRewardPercentageSet.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_ClaimDefaultRewardPercentageSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    percent: event.params.percent,
  };

  context.DepositRedemptionVault_ClaimDefaultRewardPercentageSet.set(entity);
});

DepositRedemptionVault.Disabled.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_Disabled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
  };

  context.DepositRedemptionVault_Disabled.set(entity);
});

DepositRedemptionVault.Enabled.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_Enabled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
  };

  context.DepositRedemptionVault_Enabled.set(entity);
});

DepositRedemptionVault.FacilityAuthorized.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_FacilityAuthorized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    facility: event.params.facility,
  };

  context.DepositRedemptionVault_FacilityAuthorized.set(entity);
});

DepositRedemptionVault.FacilityDeauthorized.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_FacilityDeauthorized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    facility: event.params.facility,
  };

  context.DepositRedemptionVault_FacilityDeauthorized.set(entity);
});

DepositRedemptionVault.LoanCreated.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_LoanCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    redemptionId: event.params.redemptionId,
    amount: event.params.amount,
    facility: event.params.facility,
  };

  context.DepositRedemptionVault_LoanCreated.set(entity);
});

DepositRedemptionVault.LoanDefaulted.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_LoanDefaulted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    redemptionId: event.params.redemptionId,
    principal: event.params.principal,
    interest: event.params.interest,
    remainingCollateral: event.params.remainingCollateral,
  };

  context.DepositRedemptionVault_LoanDefaulted.set(entity);
});

DepositRedemptionVault.LoanExtended.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_LoanExtended = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    redemptionId: event.params.redemptionId,
    newDueDate: event.params.newDueDate,
  };

  context.DepositRedemptionVault_LoanExtended.set(entity);
});

DepositRedemptionVault.LoanRepaid.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_LoanRepaid = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    redemptionId: event.params.redemptionId,
    principal: event.params.principal,
    interest: event.params.interest,
  };

  context.DepositRedemptionVault_LoanRepaid.set(entity);
});

DepositRedemptionVault.MaxBorrowPercentageSet.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_MaxBorrowPercentageSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    asset: event.params.asset,
    facility: event.params.facility,
    percent: event.params.percent,
  };

  context.DepositRedemptionVault_MaxBorrowPercentageSet.set(entity);
});

DepositRedemptionVault.RedemptionCancelled.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_RedemptionCancelled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    redemptionId: event.params.redemptionId,
    depositToken: event.params.depositToken,
    depositPeriod: event.params.depositPeriod,
    amount: event.params.amount,
    remainingAmount: event.params.remainingAmount,
  };

  context.DepositRedemptionVault_RedemptionCancelled.set(entity);
});

DepositRedemptionVault.RedemptionFinished.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_RedemptionFinished = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    redemptionId: event.params.redemptionId,
    depositToken: event.params.depositToken,
    depositPeriod: event.params.depositPeriod,
    amount: event.params.amount,
  };

  context.DepositRedemptionVault_RedemptionFinished.set(entity);
});

DepositRedemptionVault.RedemptionStarted.handler(async ({ event, context }) => {
  const entity: DepositRedemptionVault_RedemptionStarted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    redemptionId: event.params.redemptionId,
    depositToken: event.params.depositToken,
    depositPeriod: event.params.depositPeriod,
    amount: event.params.amount,
    facility: event.params.facility,
  };

  context.DepositRedemptionVault_RedemptionStarted.set(entity);
});
