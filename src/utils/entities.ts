import {
  Auctioneer,
  ConvertibleDepositPosition,
  DepositAsset,
  DepositAssetPeriod,
  DepositFacility,
  ReceiptToken,
  Redemption,
} from "generated";
import { getAddressId, getPositionId, getReceiptTokenId } from "../utils/ids";
import { DepositRedemptionVault } from "generated/src/Types.gen";
import { fetchReceiptTokenId, fetchReceiptTokenManager } from "./depositManager";

export async function getOrCreateAuctioneer(context: any, chainId: bigint, address: string): Promise<Auctioneer> {
  const id = getAddressId(chainId, address);
  const existing = await context.Auctioneer.get(id);
  if (existing) return existing as Auctioneer;
  const created: Auctioneer = {
    id,
    chainId: BigInt(chainId),
    address: address.toLowerCase(),
    majorVersion: "",
    minorVersion: "",
    enabled: false,
    auctionTrackingPeriod: BigInt(0),
  };
  context.Auctioneer.set(created);
  return created;
}

export async function getOrCreateDepositFacility(context: any, chainId: bigint, address: string): Promise<DepositFacility> {
  const id = getAddressId(chainId, address);
  const existing = await context.DepositFacility.get(id);
  if (existing) return existing as DepositFacility;
  const created: DepositFacility = {
    id,
    chainId: BigInt(chainId),
    address: address.toLowerCase(),
    enabled: false,
  };
  context.DepositFacility.set(created);
  return created;
}

export async function getOrCreateRedemptionVault(
  context: any,
  chainId: bigint,
  address: string
): Promise<DepositRedemptionVault> {
  const id = getAddressId(chainId, address);
  const existing = await context.DepositRedemptionVault.get(id);
  if (existing) return existing as DepositRedemptionVault;
  const created: DepositRedemptionVault = {
    id,
    chainId: BigInt(chainId),
    address: address.toLowerCase(),
    enabled: false,
  };
  context.DepositRedemptionVault.set(created);
  return created;
}

export async function getOrCreateDepositAsset(
  context: any,
  chainId: bigint,
  assetId: string
): Promise<DepositAsset> {
  const id = `${chainId}_${assetId}`.toLowerCase();
  const existing = await context.DepositAsset.get(id);
  if (existing) return existing as DepositAsset;
  const created: DepositAsset = {
    id,
    chainId: BigInt(chainId),
    asset: assetId.toLowerCase(),
    enabled: true,
  } as unknown as DepositAsset;
  context.DepositAsset.set(created);
  return created;
}

export async function getOrCreateDepositAssetPeriod(
  context: any,
  chainId: bigint,
  depositAssetId: string,
  periodMonths: bigint
): Promise<DepositAssetPeriod> {
  const id = `${chainId}_${depositAssetId}_${periodMonths}`.toLowerCase();
  const existing = await context.DepositAssetPeriod.get(id);
  if (existing) return existing as DepositAssetPeriod;
  const depositAsset = await getOrCreateDepositAsset(context, chainId, depositAssetId);
  const created: DepositAssetPeriod = {
    id,
    chainId: BigInt(chainId),
    depositAsset,
    periodMonths: BigInt(periodMonths),
    enabled: true,
  } as unknown as DepositAssetPeriod;
  context.DepositAssetPeriod.set(created);
  return created;
}

export async function getOrCreateReceiptToken(
  context: any,
  chainId: bigint,
  facility: DepositFacility,
  depositAsset: `0x${string}`,
  depositAssetPeriod: DepositAssetPeriod
): Promise<ReceiptToken> {
  // Look up the ReceiptTokenManager address
  const receiptTokenManager = await context.effect(fetchReceiptTokenManager, {
    chainId,
    facility,
  }) as string;
  const receiptTokenId = await context.effect(fetchReceiptTokenId, {
    chainId,
    facility,
    asset: depositAsset,
    depositPeriod: depositAssetPeriod.periodMonths,
  }) as bigint;

  const id = getReceiptTokenId(chainId, receiptTokenManager, receiptTokenId);
  const existing = await context.ReceiptToken.get(id);
  if (existing) return existing as ReceiptToken;
  const created: ReceiptToken = {
    id,
    chainId: BigInt(chainId),
    receiptTokenManager: receiptTokenManager.toLowerCase(),
    receiptTokenId: receiptTokenId,
    facility,
    depositAssetPeriod,
  } as unknown as ReceiptToken;
  context.ReceiptToken.set(created);
  return created;
}

export async function getOrCreatePosition(
  context: any,
  chainId: bigint,
  facility: DepositFacility,
  assetPeriod: DepositAssetPeriod,
  positionId: bigint,
  depositor: string,
  receiptToken: ReceiptToken
): Promise<ConvertibleDepositPosition> {
  const id = getPositionId(chainId, positionId);
  const existing = await context.ConvertibleDepositPosition.get(id);
  if (existing) return existing as ConvertibleDepositPosition;
  const created: ConvertibleDepositPosition = {
    id,
    facility,
    chainId: BigInt(chainId),
    txHash: "",
    block: BigInt(0),
    timestamp: BigInt(0),
    positionId: BigInt(positionId),
    depositor: depositor.toLowerCase(),
    assetPeriod,
    initialAmount: BigInt(0),
    initialAmountDecimal: 0 as unknown as any,
    remainingAmount: BigInt(0),
    remainingAmountDecimal: 0 as unknown as any,
    conversionPrice: undefined,
    conversionPriceDecimal: undefined,
    receiptToken,
  } as unknown as ConvertibleDepositPosition;
  context.ConvertibleDepositPosition.set(created);
  return created;
}

export async function getOrCreateRedemption(
  context: any,
  chainId: bigint,
  redemptionVault: DepositRedemptionVault,
  facility: DepositFacility,
  user: string,
  depositAssetPeriod: DepositAssetPeriod,
  idSeed: string | number | bigint
): Promise<Redemption> {
  const id = `${chainId}_${idSeed}`;
  const existing = await context.Redemption.get(id);
  if (existing) return existing as Redemption;
  const created: Redemption = {
    id,
    chainId: BigInt(chainId),
    redemptionVault,
    user: user.toLowerCase(),
    depositAssetPeriod,
    facility,
  } as unknown as Redemption;
  context.Redemption.set(created);
  return created;
}


