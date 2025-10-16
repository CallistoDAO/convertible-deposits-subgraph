/*
 * Event handlers for DepositRedemptionVault contract
 */
import {
  DepositRedemptionVault,
  type DepositRedemptionVault_AnnualInterestRateSet,
  type DepositRedemptionVault_ClaimDefaultRewardPercentageSet,
  type DepositRedemptionVault_Disabled,
  type DepositRedemptionVault_Enabled,
  type DepositRedemptionVault_FacilityAuthorized,
  type DepositRedemptionVault_FacilityDeauthorized,
  type DepositRedemptionVault_LoanCreated,
  type DepositRedemptionVault_LoanDefaulted,
  type DepositRedemptionVault_LoanExtended,
  type DepositRedemptionVault_LoanRepaid,
  type DepositRedemptionVault_MaxBorrowPercentageSet,
  type DepositRedemptionVault_RedemptionCancelled,
  type DepositRedemptionVault_RedemptionFinished,
  type DepositRedemptionVault_RedemptionStarted,
} from "generated";
import type { Hex } from "viem";
import {
  getAsset,
  getDepositAsset,
  getDepositAssetPeriod,
  getDepositAssetPeriodDecimals,
} from "../entities/asset";
import { getDepositFacility, getOrCreateDepositFacility } from "../entities/depositFacility";
import { updatePositionFromContract } from "../entities/position";
import { getOrCreateRedemption, getRedemption } from "../entities/redemption";
import { getOrCreateRedemptionLoan, getRedemptionLoan } from "../entities/redemptionLoan";
import {
  getOrCreateRedemptionVault,
  getOrCreateRedemptionVaultAssetConfiguration,
} from "../entities/redemptionVault";
import {
  updateFacilityAssetBorrowedAmount,
  updateFacilityAssetDeposited,
  updateFacilityAssetPendingRedemption,
} from "../entities/snapshot";
import { toBpsDecimal, toDecimal } from "../utils/decimal";
import { getBlockId } from "../utils/ids";

DepositRedemptionVault.AnnualInterestRateSet.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const assetConfiguration = await getOrCreateRedemptionVaultAssetConfiguration(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.facility as Hex,
    event.params.asset as Hex,
  );

  // Record event
  const entity: DepositRedemptionVault_AnnualInterestRateSet = {
    id,
    assetConfiguration_id: assetConfiguration.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    rate: event.params.rate,
    rateDecimal: toBpsDecimal(event.params.rate),
  };
  context.DepositRedemptionVault_AnnualInterestRateSet.set(entity);

  // Update asset configuration with new interest rate
  const updatedAssetConfiguration = {
    ...assetConfiguration,
    interestRate: event.params.rate,
    interestRateDecimal: toBpsDecimal(event.params.rate),
  };
  context.DepositRedemptionVaultAssetConfiguration.set(updatedAssetConfiguration);
});

DepositRedemptionVault.ClaimDefaultRewardPercentageSet.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const redemptionVault = await getOrCreateRedemptionVault(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );

  // Record event
  const entity: DepositRedemptionVault_ClaimDefaultRewardPercentageSet = {
    id,
    redemptionVault_id: redemptionVault.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    percent: event.params.percent,
    percentDecimal: toBpsDecimal(event.params.percent),
  };
  context.DepositRedemptionVault_ClaimDefaultRewardPercentageSet.set(entity);

  // Update redemption vault with new claim default reward percentage
  const updatedRedemptionVault = {
    ...redemptionVault,
    claimDefaultRewardPercentage: event.params.percent,
    claimDefaultRewardPercentageDecimal: toBpsDecimal(event.params.percent),
  };
  context.DepositRedemptionVault.set(updatedRedemptionVault);
});

DepositRedemptionVault.Disabled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const redemptionVault = await getOrCreateRedemptionVault(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );

  // Record event
  const entity: DepositRedemptionVault_Disabled = {
    id,
    redemptionVault_id: redemptionVault.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.DepositRedemptionVault_Disabled.set(entity);

  // Update redemption vault status
  const updatedRedemptionVault = {
    ...redemptionVault,
    enabled: false,
  };
  context.DepositRedemptionVault.set(updatedRedemptionVault);
});

DepositRedemptionVault.Enabled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const redemptionVault = await getOrCreateRedemptionVault(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );

  // Record event
  const entity: DepositRedemptionVault_Enabled = {
    id,
    redemptionVault_id: redemptionVault.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.DepositRedemptionVault_Enabled.set(entity);

  // Update redemption vault status
  const updatedRedemptionVault = {
    ...redemptionVault,
    enabled: true,
  };
  context.DepositRedemptionVault.set(updatedRedemptionVault);
});

DepositRedemptionVault.FacilityAuthorized.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const redemptionVault = await getOrCreateRedemptionVault(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.params.facility as Hex,
  );

  // Record event
  const entity: DepositRedemptionVault_FacilityAuthorized = {
    id,
    redemptionVault_id: redemptionVault.id,
    facility_id: facility.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.DepositRedemptionVault_FacilityAuthorized.set(entity);
});

DepositRedemptionVault.FacilityDeauthorized.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const redemptionVault = await getOrCreateRedemptionVault(
    context,
    event.chainId,
    event.srcAddress as Hex,
  );
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.params.facility as Hex,
  );

  // Record event
  const entity: DepositRedemptionVault_FacilityDeauthorized = {
    id,
    redemptionVault_id: redemptionVault.id,
    facility_id: facility.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };
  context.DepositRedemptionVault_FacilityDeauthorized.set(entity);
});

DepositRedemptionVault.LoanCreated.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const redemption = await getRedemption(
    context,
    event.chainId,
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.params.facility as Hex,
  );
  const depositAssetPeriod = await getDepositAssetPeriod(context, redemption.depositAssetPeriod_id);
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  const asset = await getAsset(context, depositAsset.asset_id);

  // Create the RedemptionLoan record
  const redemptionLoan = await getOrCreateRedemptionLoan(
    context,
    event.chainId,
    event.srcAddress as Hex,
    facility.address as Hex,
    asset.address as Hex,
    depositAssetPeriod.periodMonths,
    event.params.user as Hex,
    Number(event.params.redemptionId),
    Number(event.block.timestamp),
  );

  // Record event
  const entity: DepositRedemptionVault_LoanCreated = {
    id,
    redemptionLoan_id: redemptionLoan.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, asset.decimals),
  };
  context.DepositRedemptionVault_LoanCreated.set(entity);

  // Update position amount
  if (redemption.position_id) {
    await updatePositionFromContract(context, redemption.position_id, asset.decimals);
  }

  // Update facility asset snapshot with new loan (positive delta for borrowed amount)
  await updateFacilityAssetBorrowedAmount(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    event.params.amount, // Positive for new loan
  );
  // Reduce asset deposits
  await updateFacilityAssetDeposited(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    -event.params.amount, // Negative for new loan
  );
});

DepositRedemptionVault.LoanDefaulted.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const redemption = await getRedemption(
    context,
    event.chainId,
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const redemptionLoan = await getRedemptionLoan(
    context,
    event.chainId,
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const assetDecimals = await getDepositAssetPeriodDecimals(
    context,
    redemption.depositAssetPeriod_id,
  );

  // Record event
  const entity: DepositRedemptionVault_LoanDefaulted = {
    id,
    redemptionLoan_id: redemptionLoan.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    principal: event.params.principal,
    principalDecimal: toDecimal(event.params.principal, assetDecimals),
    interest: event.params.interest,
    interestDecimal: toDecimal(event.params.interest, assetDecimals),
    remainingCollateral: event.params.remainingCollateral,
    remainingCollateralDecimal: toDecimal(event.params.remainingCollateral, assetDecimals),
  };
  context.DepositRedemptionVault_LoanDefaulted.set(entity);

  // Update loan status
  const updatedLoan = {
    ...redemptionLoan,
    status: "defaulted",
  };
  context.RedemptionLoan.set(updatedLoan);

  // Update position amount
  if (redemption.position_id) {
    await updatePositionFromContract(context, redemption.position_id, assetDecimals);
  }

  // Update facility asset snapshot with defaulted loan (negative delta for reduction in borrowed amount)
  const facility = await getDepositFacility(context, redemption.facility_id);
  const depositAssetPeriod = await getDepositAssetPeriod(context, redemption.depositAssetPeriod_id);
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  // Reduce loan amount
  await updateFacilityAssetBorrowedAmount(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    -event.params.principal, // Negative for defaulted loan
  );
  // No increase in deposits, since it is repossessed by the protocol
});

DepositRedemptionVault.LoanExtended.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const redemption = await getRedemption(
    context,
    event.chainId,
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const redemptionLoan = await getRedemptionLoan(
    context,
    event.chainId,
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const assetDecimals = await getDepositAssetPeriodDecimals(
    context,
    redemption.depositAssetPeriod_id,
  );

  // Record event
  const entity: DepositRedemptionVault_LoanExtended = {
    id,
    redemptionLoan_id: redemptionLoan.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    newDueDate: event.params.newDueDate,
  };
  context.DepositRedemptionVault_LoanExtended.set(entity);

  // Update loan due date
  const updatedLoan = {
    ...redemptionLoan,
    dueDate: event.params.newDueDate,
  };
  context.RedemptionLoan.set(updatedLoan);

  // Update position amount
  if (redemption.position_id) {
    await updatePositionFromContract(context, redemption.position_id, assetDecimals);
  }
});

DepositRedemptionVault.LoanRepaid.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const redemption = await getRedemption(
    context,
    event.chainId,
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const redemptionLoan = await getRedemptionLoan(
    context,
    event.chainId,
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const assetDecimals = await getDepositAssetPeriodDecimals(
    context,
    redemption.depositAssetPeriod_id,
  );

  // Record event
  const entity: DepositRedemptionVault_LoanRepaid = {
    id,
    redemptionLoan_id: redemptionLoan.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    principal: event.params.principal,
    principalDecimal: toDecimal(event.params.principal, assetDecimals),
    interest: event.params.interest,
    interestDecimal: toDecimal(event.params.interest, assetDecimals),
  };
  context.DepositRedemptionVault_LoanRepaid.set(entity);

  // Update loan status
  const updatedLoan = {
    ...redemptionLoan,
    status: event.params.principal === BigInt(0) ? "repaid" : "active",
    principal: event.params.principal,
    principalDecimal: toDecimal(event.params.principal, assetDecimals),
    interest: event.params.interest,
    interestDecimal: toDecimal(event.params.interest, assetDecimals),
  };
  context.RedemptionLoan.set(updatedLoan);

  // Update position amount
  if (redemption.position_id) {
    await updatePositionFromContract(context, redemption.position_id, assetDecimals);
  }

  // Update facility asset snapshot with repaid loan (negative delta for reduction in borrowed amount)
  const facility = await getDepositFacility(context, redemption.facility_id);
  const depositAssetPeriod = await getDepositAssetPeriod(context, redemption.depositAssetPeriod_id);
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  // Calculate the amount repaid (old principal - new principal)
  const amountRepaid = redemptionLoan.principal - event.params.principal;

  if (amountRepaid > BigInt(0)) {
    // Reduction in borrowed amount
    await updateFacilityAssetBorrowedAmount(
      context,
      event.chainId,
      event.block.number,
      event.block.timestamp,
      facility,
      depositAsset,
      -amountRepaid, // Negative for loan repayment
    );
    // Increase in deposited assets
    await updateFacilityAssetDeposited(
      context,
      event.chainId,
      event.block.number,
      event.block.timestamp,
      facility,
      depositAsset,
      amountRepaid, // Positive for loan repayment
    );
  }
});

DepositRedemptionVault.MaxBorrowPercentageSet.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Create/fetch records
  const assetConfiguration = await getOrCreateRedemptionVaultAssetConfiguration(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.facility as Hex,
    event.params.asset as Hex,
  );

  // Record event
  const entity: DepositRedemptionVault_MaxBorrowPercentageSet = {
    id,
    assetConfiguration_id: assetConfiguration.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    percent: event.params.percent,
    percentDecimal: toBpsDecimal(event.params.percent),
  };
  context.DepositRedemptionVault_MaxBorrowPercentageSet.set(entity);

  // Update asset configuration with new max borrow percentage
  const updatedAssetConfiguration = {
    ...assetConfiguration,
    maxBorrowPercentage: event.params.percent,
    maxBorrowPercentageDecimal: toBpsDecimal(event.params.percent),
  };
  context.DepositRedemptionVaultAssetConfiguration.set(updatedAssetConfiguration);
});

DepositRedemptionVault.RedemptionCancelled.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Fetch/create records
  const redemption = await getRedemption(
    context,
    event.chainId,
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const assetDecimals = await getDepositAssetPeriodDecimals(
    context,
    redemption.depositAssetPeriod_id,
  );

  // Record event
  const entity: DepositRedemptionVault_RedemptionCancelled = {
    id,
    redemption_id: redemption.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
    remainingAmount: event.params.remainingAmount,
    remainingAmountDecimal: toDecimal(event.params.remainingAmount, assetDecimals),
  };
  context.DepositRedemptionVault_RedemptionCancelled.set(entity);

  // Update redemption amount
  const updatedRedemption = {
    ...redemption,
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
  };
  context.Redemption.set(updatedRedemption);

  // Update position amount
  if (redemption.position_id) {
    await updatePositionFromContract(context, redemption.position_id, assetDecimals);
  }

  // Update facility asset snapshot with cancelled redemption (negative delta)
  const facility = await getDepositFacility(context, redemption.facility_id);
  const depositAssetPeriod = await getDepositAssetPeriod(context, redemption.depositAssetPeriod_id);
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  // Reduce pending redemption amount
  await updateFacilityAssetPendingRedemption(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    -redemption.amount, // Negative for cancelled redemption (use the old amount before update)
  );
  // No increase in deposits, since assets are still in the DepositManager
});

DepositRedemptionVault.RedemptionFinished.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Fetch/create records
  const redemption = await getRedemption(
    context,
    event.chainId,
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const assetDecimals = await getDepositAssetPeriodDecimals(
    context,
    redemption.depositAssetPeriod_id,
  );

  // Record event
  const entity: DepositRedemptionVault_RedemptionFinished = {
    id,
    redemption_id: redemption.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
  };
  context.DepositRedemptionVault_RedemptionFinished.set(entity);

  // Update redemption amount
  const updatedRedemption = {
    ...redemption,
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
  };
  context.Redemption.set(updatedRedemption);

  // Update position amount
  if (redemption.position_id) {
    await updatePositionFromContract(context, redemption.position_id, assetDecimals);
  }

  // Update facility asset snapshot with completed redemption (negative delta)
  const facility = await getDepositFacility(context, redemption.facility_id);
  const depositAssetPeriod = await getDepositAssetPeriod(context, redemption.depositAssetPeriod_id);
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  // Reduction in pending redemption amount
  await updateFacilityAssetPendingRedemption(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    -event.params.amount, // Negative for completed redemption
  );
  // Reduction in deposited assets
  await updateFacilityAssetDeposited(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    -event.params.amount, // Negative for completed redemption
  );
});

DepositRedemptionVault.RedemptionStarted.handler(async ({ event, context }) => {
  const id = getBlockId(event.chainId, event.block.number, event.logIndex);

  // Fetch/create records
  const redemption = await getOrCreateRedemption(
    context,
    event.chainId,
    event.srcAddress as Hex,
    event.params.facility as Hex,
    event.params.depositToken as Hex,
    Number(event.params.depositPeriod),
    event.params.user as Hex,
    Number(event.params.redemptionId),
  );
  const assetDecimals = await getDepositAssetPeriodDecimals(
    context,
    redemption.depositAssetPeriod_id,
  );

  // Record event
  const entity: DepositRedemptionVault_RedemptionStarted = {
    id,
    redemption_id: redemption.id,
    chainId: event.chainId,
    txHash: event.transaction.hash,
    block: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
  };
  context.DepositRedemptionVault_RedemptionStarted.set(entity);

  // Update redemption amount
  const updatedRedemption = {
    ...redemption,
    amount: event.params.amount,
    amountDecimal: toDecimal(event.params.amount, assetDecimals),
  };
  context.Redemption.set(updatedRedemption);

  // Update position amount
  if (redemption.position_id) {
    await updatePositionFromContract(context, redemption.position_id, assetDecimals);
  }

  // Update facility asset snapshot with pending redemption
  const facility = await getOrCreateDepositFacility(
    context,
    event.chainId,
    event.params.facility as Hex,
  );
  const depositAssetPeriod = await getDepositAssetPeriod(context, redemption.depositAssetPeriod_id);
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  // Increase in pending redemption amount
  await updateFacilityAssetPendingRedemption(
    context,
    event.chainId,
    event.block.number,
    event.block.timestamp,
    facility,
    depositAsset,
    event.params.amount, // Positive for new redemption
  );
  // No increase in deposits, since assets are still in the DepositManager
});
