import type { ReceiptToken } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { fetchReceiptTokenId, fetchReceiptTokenManager } from "../contracts/depositManager";
import { getReceiptTokenId } from "../utils/ids";
import { getOrCreateDepositAssetPeriod } from "./asset";
import { getOrCreateDepositFacility } from "./depositFacility";

export async function getOrCreateReceiptToken(
  context: HandlerContext,
  chainId: number,
  facilityAddress: string,
  depositAssetAddress: string,
  depositAssetPeriodMonths: number,
): Promise<ReceiptToken> {
  // Look up the ReceiptTokenManager address
  const receiptTokenManager = await context.effect(fetchReceiptTokenManager, {
    chainId,
    facility: facilityAddress,
  });
  const receiptTokenId = await context.effect(fetchReceiptTokenId, {
    chainId,
    facility: facilityAddress,
    asset: depositAssetAddress,
    depositPeriod: depositAssetPeriodMonths,
  });

  const id = getReceiptTokenId(chainId, receiptTokenManager, receiptTokenId);
  const existing = await context.ReceiptToken.get(id);
  if (existing) return existing as ReceiptToken;

  const facility = await getOrCreateDepositFacility(context, chainId, facilityAddress);
  const depositAssetPeriod = await getOrCreateDepositAssetPeriod(
    context,
    chainId,
    depositAssetAddress,
    depositAssetPeriodMonths,
  );

  const created: ReceiptToken = {
    id,
    chainId: chainId,
    receiptTokenManager: receiptTokenManager.toLowerCase(),
    receiptTokenId: receiptTokenId,
    facility_id: facility.id,
    depositAssetPeriod_id: depositAssetPeriod.id,
  };
  context.ReceiptToken.set(created);
  return created;
}
