import type { ConvertibleDepositPosition } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { fetchPosition } from "../contracts/position";
import { toDecimal } from "../utils/decimal";
import { getPositionId } from "../utils/ids";
import { getDepositAssetPeriodDecimals, getOrCreateDepositAssetPeriod } from "./asset";
import { getOrCreateDepositFacility } from "./depositFacility";
import { getOrCreateDepositor } from "./depositor";
import { getOrCreateReceiptToken } from "./receiptToken";

const UINT256_MAX = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

export async function getOrCreatePosition(
  context: HandlerContext,
  chainId: number,
  facilityAddress: string,
  depositAssetAddress: string,
  depositAssetPeriodMonths: number,
  positionId: bigint,
  depositorAddress: string,
  txHash: string,
  block: bigint,
  timestamp: bigint,
): Promise<ConvertibleDepositPosition> {
  const id = getPositionId(chainId, positionId);
  const existing = await context.ConvertibleDepositPosition.get(id);
  if (existing) return existing as ConvertibleDepositPosition;

  const facility = await getOrCreateDepositFacility(context, chainId, facilityAddress);
  const depositor = await getOrCreateDepositor(context, chainId, depositorAddress);
  const depositAssetPeriod = await getOrCreateDepositAssetPeriod(
    context,
    chainId,
    depositAssetAddress,
    depositAssetPeriodMonths,
  );
  const assetDecimals = await getDepositAssetPeriodDecimals(context, depositAssetPeriod.id);
  const receiptToken = await getOrCreateReceiptToken(
    context,
    chainId,
    facilityAddress,
    depositAssetAddress,
    depositAssetPeriodMonths,
  );

  // Fetch position data from contract
  const position = await context.effect(fetchPosition, {
    chainId,
    positionId,
  });

  // Determine the conversion price
  let conversionPrice: bigint | undefined;
  if (position.conversionPrice !== UINT256_MAX) {
    conversionPrice = position.conversionPrice;
  }

  const created: ConvertibleDepositPosition = {
    id,
    facility_id: facility.id,
    chainId: chainId,
    txHash: txHash.toLowerCase(),
    block: BigInt(block),
    timestamp: BigInt(timestamp),
    positionId: BigInt(positionId),
    depositor_id: depositor.id,
    assetPeriod_id: depositAssetPeriod.id,
    initialAmount: position.remainingDeposit,
    initialAmountDecimal: toDecimal(position.remainingDeposit, assetDecimals),
    remainingAmount: position.remainingDeposit,
    remainingAmountDecimal: toDecimal(position.remainingDeposit, assetDecimals),
    conversionPrice: conversionPrice,
    conversionPriceDecimal: conversionPrice ? toDecimal(conversionPrice, assetDecimals) : undefined,
    receiptToken_id: receiptToken.id,
  };
  context.ConvertibleDepositPosition.set(created);

  return created;
}

export async function getPosition(
  context: HandlerContext,
  recordId: string,
): Promise<ConvertibleDepositPosition> {
  const existing = await context.ConvertibleDepositPosition.get(recordId);
  if (!existing) {
    throw new Error(`Position ${recordId} not found`);
  }

  return existing as ConvertibleDepositPosition;
}
