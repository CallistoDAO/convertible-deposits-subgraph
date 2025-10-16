import type { Auctioneer, AuctioneerDepositPeriod } from "generated";
import type { HandlerContext } from "generated/src/Types";
import {
  fetchAuctioneerDepositAsset,
  fetchAuctioneerTickStep,
  fetchAuctioneerTrackingPeriod,
  fetchAuctioneerVersion,
} from "../contracts/auctioneer";
import { toBpsDecimal } from "../utils/decimal";
import { buildEntityId, getAddressId } from "../utils/ids";
import { getOrCreateDepositAsset, getOrCreateDepositAssetPeriod } from "./asset";

export async function getOrCreateAuctioneerDepositPeriod(
  context: HandlerContext,
  chainId: number,
  auctioneer: Auctioneer,
  assetAddress: string,
  periodMonths: number,
): Promise<AuctioneerDepositPeriod> {
  const id = buildEntityId([chainId, auctioneer.address, assetAddress, periodMonths]);
  const existing = await context.AuctioneerDepositPeriod.get(id);
  if (existing) return existing as AuctioneerDepositPeriod;

  // Get the deposit asset decimals
  const depositAssetPeriod = await getOrCreateDepositAssetPeriod(
    context,
    chainId,
    assetAddress,
    periodMonths,
  );

  const created: AuctioneerDepositPeriod = {
    id,
    chainId: chainId,
    auctioneer_id: auctioneer.id,
    depositAssetPeriod_id: depositAssetPeriod.id,
    enabled: false,
  };
  context.AuctioneerDepositPeriod.set(created);
  return created;
}

export async function getOrCreateAuctioneer(
  context: HandlerContext,
  chainId: number,
  address: string,
): Promise<Auctioneer> {
  const id = getAddressId(chainId, address);
  const existing = await context.Auctioneer.get(id);
  if (existing) return existing as Auctioneer;

  const contractVersion = await context.effect(fetchAuctioneerVersion, { chainId, address });
  const trackingPeriod = await context.effect(fetchAuctioneerTrackingPeriod, { chainId, address });
  const depositAssetAddress = await context.effect(fetchAuctioneerDepositAsset, {
    chainId,
    address,
  });
  const depositAsset = await getOrCreateDepositAsset(context, chainId, depositAssetAddress);
  const tickStep = await context.effect(fetchAuctioneerTickStep, { chainId, address });

  const created: Auctioneer = {
    id,
    chainId: chainId,
    address: address.toLowerCase(),
    majorVersion: contractVersion.major,
    minorVersion: contractVersion.minor,
    depositAsset_id: depositAsset.id,
    enabled: false,
    auctionTrackingPeriod: trackingPeriod,
    tickStep: BigInt(tickStep),
    tickStepDecimal: toBpsDecimal(tickStep),
  };
  context.Auctioneer.set(created);
  return created;
}

export async function getAuctioneer(
  context: HandlerContext,
  recordId: string,
): Promise<Auctioneer> {
  const existing = await context.Auctioneer.get(recordId);
  if (!existing) {
    throw new Error(`Auctioneer not found: ${recordId}`);
  }

  return existing as Auctioneer;
}
