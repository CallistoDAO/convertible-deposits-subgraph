import type { Asset, DepositAsset, DepositAssetPeriod } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { fetchAssetDecimals, fetchAssetName, fetchAssetSymbol } from "../contracts/asset";
import { buildEntityId, getAddressId } from "../utils/ids";

/**
 * Get or create an Asset
 *
 * @param context - The handler context
 * @param chainId - The chain ID
 * @param address - The asset address
 * @returns The asset
 */
export async function getOrCreateAsset(
  context: HandlerContext,
  chainId: number,
  address: string,
): Promise<Asset> {
  const id = getAddressId(chainId, address);
  const existing = await context.Asset.get(id);
  if (existing) return existing as Asset;

  // Fetch asset details from contract
  const decimals = await context.effect(fetchAssetDecimals, { chainId, address });
  const name = (await context.effect(fetchAssetName, { chainId, address })) as string;
  const symbol = (await context.effect(fetchAssetSymbol, { chainId, address })) as string;

  const created: Asset = {
    id,
    chainId: chainId,
    address: address.toLowerCase(),
    decimals,
    name,
    symbol,
  };
  context.Asset.set(created);
  return created;
}

/**
 * Get an Asset record from the ID
 *
 * @param context - The handler context
 * @param assetId - The asset ID
 * @returns The asset
 */
export async function getAsset(context: HandlerContext, assetId: string): Promise<Asset> {
  const asset = await context.Asset.get(assetId);
  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }
  return asset as Asset;
}

export async function getAssetDecimals(
  context: HandlerContext,
  chainId: number,
  assetAddress: string,
): Promise<number> {
  const asset = await getAsset(context, getAddressId(chainId, assetAddress));
  return asset.decimals;
}

/**
 * Get or create a DepositAsset
 *
 * @param context
 * @param chainId
 * @param assetAddress
 * @returns
 */
export async function getOrCreateDepositAsset(
  context: HandlerContext,
  chainId: number,
  assetAddress: string,
): Promise<DepositAsset> {
  const id = getAddressId(chainId, assetAddress);
  const existing = await context.DepositAsset.get(id);
  if (existing) return existing as DepositAsset;

  // Create the underlying Asset record
  const asset = await getOrCreateAsset(context, chainId, assetAddress);

  const created: DepositAsset = {
    id,
    chainId: chainId,
    asset_id: asset.id,
    enabled: true,
  };
  context.DepositAsset.set(created);
  return created;
}

/**
 * Get a DepositAsset record from the ID
 *
 * @param context
 * @param assetId
 * @returns
 */
export async function getDepositAsset(
  context: HandlerContext,
  assetId: string,
): Promise<DepositAsset> {
  const asset = await context.DepositAsset.get(assetId);
  if (!asset) {
    throw new Error(`DepositAsset not found: ${assetId}`);
  }
  return asset as DepositAsset;
}

export async function getDepositAssetDecimals(
  context: HandlerContext,
  assetId: string,
): Promise<number> {
  const depositAsset = await getDepositAsset(context, assetId);
  const asset = await getAsset(context, depositAsset.asset_id);

  return asset.decimals;
}

/**
 * Get or create a DepositAssetPeriod
 *
 * @param context
 * @param chainId
 * @param depositAssetId
 * @param periodMonths
 * @returns
 */
export async function getOrCreateDepositAssetPeriod(
  context: HandlerContext,
  chainId: number,
  depositAssetAddress: string,
  periodMonths: number,
): Promise<DepositAssetPeriod> {
  const id = buildEntityId([chainId, depositAssetAddress, periodMonths]);
  const existing = await context.DepositAssetPeriod.get(id);
  if (existing) return existing as DepositAssetPeriod;

  // Create the underlying DepositAsset record
  const depositAsset = await getOrCreateDepositAsset(context, chainId, depositAssetAddress);

  const created: DepositAssetPeriod = {
    id,
    chainId: chainId,
    depositAsset_id: depositAsset.id,
    periodMonths: periodMonths,
    enabled: true, // TODO confirm if enabled by default
  };
  context.DepositAssetPeriod.set(created);
  return created;
}

/**
 * Get a DepositAssetPeriod record from the ID
 *
 * @param context
 * @param id
 * @returns
 */
export async function getDepositAssetPeriod(
  context: HandlerContext,
  id: string,
): Promise<DepositAssetPeriod> {
  const existing = await context.DepositAssetPeriod.get(id);
  if (!existing) {
    throw new Error(`DepositAssetPeriod not found: ${id}`);
  }
  return existing as DepositAssetPeriod;
}

export async function getDepositAssetPeriodDecimals(
  context: HandlerContext,
  id: string,
): Promise<number> {
  const depositAssetPeriod = await getDepositAssetPeriod(context, id);
  const depositAsset = await getDepositAsset(context, depositAssetPeriod.depositAsset_id);
  const asset = await getAsset(context, depositAsset.asset_id);
  return asset.decimals;
}
