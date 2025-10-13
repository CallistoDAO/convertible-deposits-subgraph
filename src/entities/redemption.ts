import type { Redemption } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { fetchRedemption } from "../contracts/redemptionVault";
import { toDecimal } from "../utils/decimal";
import { buildEntityId, getPositionId } from "../utils/ids";
import { getDepositAssetPeriodDecimals, getOrCreateDepositAssetPeriod } from "./asset";
import { getOrCreateDepositFacility } from "./depositFacility";
import { getOrCreateDepositor } from "./depositor";
import { getOrCreateReceiptToken } from "./receiptToken";
import { getOrCreateRedemptionVault } from "./redemptionVault";

const UINT256_MAX = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

export async function getOrCreateRedemption(
  context: HandlerContext,
  chainId: number,
  redemptionVaultAddress: string,
  facilityAddress: string,
  depositAssetAddress: string,
  depositAssetPeriodMonths: number,
  userAddress: string,
  redemptionId: number,
): Promise<Redemption> {
  const id = buildEntityId([chainId, userAddress, redemptionId]);
  const existing = await context.Redemption.get(id);
  if (existing) return existing as Redemption;

  const depositor = await getOrCreateDepositor(context, chainId, userAddress);
  const receiptToken = await getOrCreateReceiptToken(
    context,
    chainId,
    facilityAddress,
    depositAssetAddress,
    depositAssetPeriodMonths,
  );
  const redemptionVault = await getOrCreateRedemptionVault(
    context,
    chainId,
    redemptionVaultAddress,
  );
  const facility = await getOrCreateDepositFacility(context, chainId, facilityAddress);
  const depositAssetPeriod = await getOrCreateDepositAssetPeriod(
    context,
    chainId,
    depositAssetAddress,
    depositAssetPeriodMonths,
  );
  const assetDecimals = await getDepositAssetPeriodDecimals(context, depositAssetPeriod.id);

  // Fetch redemption data from contract
  const redemption = await context.effect(fetchRedemption, {
    chainId,
    vaultAddress: redemptionVaultAddress,
    userAddress,
    redemptionId,
  });
  const positionId =
    redemption.positionId === UINT256_MAX
      ? undefined
      : getPositionId(chainId, redemption.positionId);

  // Create redemption record
  const created: Redemption = {
    id,
    chainId: chainId,
    redemptionVault_id: redemptionVault.id,
    depositor_id: depositor.id,
    depositAssetPeriod_id: depositAssetPeriod.id,
    facility_id: facility.id,
    receiptToken_id: receiptToken.id,
    amount: redemption.amount,
    amountDecimal: toDecimal(redemption.amount, assetDecimals),
    redeemableAt: BigInt(redemption.redeemableAt),
    position_id: positionId,
  };
  context.Redemption.set(created);
  return created;
}

export async function getRedemption(
  context: HandlerContext,
  chainId: number,
  userAddress: string,
  redemptionId: number,
): Promise<Redemption> {
  const id = buildEntityId([chainId, userAddress, redemptionId]);
  const existing = await context.Redemption.get(id);

  if (!existing) {
    throw new Error(`Redemption ${id} not found`);
  }

  return existing as Redemption;
}
