import type { RedemptionLoan } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { fetchLoan } from "../contracts/redemptionVault";
import { toDecimal } from "../utils/decimal";
import { buildEntityId } from "../utils/ids";
import { getDepositAssetPeriodDecimals } from "./asset";
import { getOrCreateRedemption } from "./redemption";

export async function getOrCreateRedemptionLoan(
  context: HandlerContext,
  chainId: number,
  redemptionVaultAddress: string,
  facilityAddress: string,
  depositAssetAddress: string,
  depositAssetPeriodMonths: number,
  userAddress: string,
  redemptionId: number,
  createdAt: number,
): Promise<RedemptionLoan> {
  const id = buildEntityId([chainId, redemptionVaultAddress, userAddress, redemptionId]);
  const existing = await context.RedemptionLoan.get(id);
  if (existing) return existing as RedemptionLoan;

  const redemption = await getOrCreateRedemption(
    context,
    chainId,
    redemptionVaultAddress,
    facilityAddress,
    depositAssetAddress,
    depositAssetPeriodMonths,
    userAddress,
    redemptionId,
  );
  const assetDecimals = await getDepositAssetPeriodDecimals(
    context,
    redemption.depositAssetPeriod_id,
  );

  // Fetch loan data from contract
  const loan = await context.effect(fetchLoan, {
    chainId,
    vaultAddress: redemptionVaultAddress,
    userAddress,
    redemptionId,
  });

  const created: RedemptionLoan = {
    id,
    chainId: chainId,
    redemption_id: redemption.id,
    initialPrincipal: loan.initialPrincipal,
    initialPrincipalDecimal: toDecimal(loan.initialPrincipal, assetDecimals),
    principal: loan.principal,
    principalDecimal: toDecimal(loan.principal, assetDecimals),
    interest: loan.interest,
    interestDecimal: toDecimal(loan.interest, assetDecimals),
    createdAt: BigInt(createdAt),
    dueDate: BigInt(loan.dueDate),
    status: "active",
  };
  context.RedemptionLoan.set(created);
  return created;
}

export async function getRedemptionLoan(
  context: HandlerContext,
  chainId: number,
  userAddress: string,
  redemptionId: number,
): Promise<RedemptionLoan> {
  const id = buildEntityId([chainId, userAddress, redemptionId]);
  const existing = await context.RedemptionLoan.get(id);
  if (!existing) {
    throw new Error(`RedemptionLoan ${id} not found`);
  }

  return existing as RedemptionLoan;
}
