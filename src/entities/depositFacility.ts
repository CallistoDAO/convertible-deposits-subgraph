import type { DepositFacility, DepositFacilityAsset, DepositFacilityAssetPeriod } from "generated";
import type { HandlerContext } from "generated/src/Types";
import {
  fetchDepositFacilityAssetCommittedAmount,
  fetchDepositFacilityAssetPeriodReclaimRate,
} from "../contracts/depositFacility";
import { toBpsDecimal, toDecimal } from "../utils/decimal";
import { buildEntityId, getAddressId } from "../utils/ids";
import {
  getDepositAssetDecimals,
  getOrCreateDepositAsset,
  getOrCreateDepositAssetPeriod,
} from "./asset";

export async function getOrCreateDepositFacility(
  context: HandlerContext,
  chainId: number,
  address: string,
): Promise<DepositFacility> {
  const id = getAddressId(chainId, address);
  const existing = await context.DepositFacility.get(id);
  if (existing) return existing as DepositFacility;

  const created: DepositFacility = {
    id,
    chainId: chainId,
    address: address.toLowerCase(),
    enabled: false,
  };
  context.DepositFacility.set(created);
  return created;
}

export async function getOrCreateDepositFacilityAsset(
  context: HandlerContext,
  chainId: number,
  facilityAddress: string,
  depositAssetAddress: string,
): Promise<DepositFacilityAsset> {
  const id = buildEntityId([chainId, facilityAddress, depositAssetAddress]);
  const existing = await context.DepositFacilityAsset.get(id);
  if (existing) return existing as DepositFacilityAsset;

  const facility = await getOrCreateDepositFacility(context, chainId, facilityAddress);
  const depositAsset = await getOrCreateDepositAsset(context, chainId, depositAssetAddress);
  const assetDecimals = await getDepositAssetDecimals(context, depositAsset.id);

  const committedAmount = await context.effect(fetchDepositFacilityAssetCommittedAmount, {
    chainId,
    facilityAddress,
    depositAssetAddress,
  });

  const created: DepositFacilityAsset = {
    id,
    chainId: chainId,
    facility_id: facility.id,
    depositAsset_id: depositAsset.id,
    committedAmount,
    committedAmountDecimal: toDecimal(committedAmount, assetDecimals),
  };
  context.DepositFacilityAsset.set(created);
  return created;
}

export async function getOrCreateDepositFacilityAssetPeriod(
  context: HandlerContext,
  chainId: number,
  facilityAddress: string,
  depositAssetAddress: string,
  depositAssetPeriodMonths: number,
): Promise<DepositFacilityAssetPeriod> {
  const id = buildEntityId([
    chainId,
    facilityAddress,
    depositAssetAddress,
    depositAssetPeriodMonths,
  ]);
  const existing = await context.DepositFacilityAssetPeriod.get(id);
  if (existing) return existing as DepositFacilityAssetPeriod;

  const facilityAsset = await getOrCreateDepositFacilityAsset(
    context,
    chainId,
    facilityAddress,
    depositAssetAddress,
  );
  const depositAssetPeriod = await getOrCreateDepositAssetPeriod(
    context,
    chainId,
    depositAssetAddress,
    depositAssetPeriodMonths,
  );

  // Fetch the reclaim rate from the contract
  const reclaimRate = await context.effect(fetchDepositFacilityAssetPeriodReclaimRate, {
    chainId,
    facilityAddress,
    depositAssetAddress,
    depositAssetPeriodMonths,
  });

  const created: DepositFacilityAssetPeriod = {
    id,
    chainId: chainId,
    facilityAsset_id: facilityAsset.id,
    depositAssetPeriod_id: depositAssetPeriod.id,
    reclaimRate: BigInt(reclaimRate),
    reclaimRateDecimal: toBpsDecimal(reclaimRate),
  };
  context.DepositFacilityAssetPeriod.set(created);
  return created;
}
