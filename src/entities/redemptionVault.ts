import type {
  depositRedemptionVault as DepositRedemptionVault,
  DepositRedemptionVaultAssetConfiguration,
} from "generated";
import type { HandlerContext } from "generated/src/Types";
import {
  fetchClaimDefaultRewardPercentage,
  fetchRedemptionVaultInterestRate,
  fetchRedemptionVaultMaxBorrowPercentage,
} from "../contracts/redemptionVault";
import { toBpsDecimal } from "../utils/decimal";
import { buildEntityId, getAddressId } from "../utils/ids";
import { getOrCreateDepositAsset } from "./asset";
import { getOrCreateDepositFacility } from "./depositFacility";

export async function getOrCreateRedemptionVault(
  context: HandlerContext,
  chainId: number,
  address: string,
): Promise<DepositRedemptionVault> {
  const id = getAddressId(chainId, address);
  const existing = await context.DepositRedemptionVault.get(id);
  if (existing) return existing as DepositRedemptionVault;

  // Fetch the claim default reward percentage from the contract
  const claimDefaultRewardPercentage = await context.effect(fetchClaimDefaultRewardPercentage, {
    chainId,
    vaultAddress: address,
  });

  const created: DepositRedemptionVault = {
    id,
    chainId: chainId,
    address: address.toLowerCase(),
    enabled: false,
    claimDefaultRewardPercentage: BigInt(claimDefaultRewardPercentage),
    claimDefaultRewardPercentageDecimal: toBpsDecimal(claimDefaultRewardPercentage),
  };
  context.DepositRedemptionVault.set(created);
  return created;
}

export async function getOrCreateRedemptionVaultAssetConfiguration(
  context: HandlerContext,
  chainId: number,
  redemptionVaultAddress: string,
  facilityAddress: string,
  depositAssetAddress: string,
): Promise<DepositRedemptionVaultAssetConfiguration> {
  const id = buildEntityId([chainId, redemptionVaultAddress, facilityAddress, depositAssetAddress]);
  const existing = await context.DepositRedemptionVaultAssetConfiguration.get(id);
  if (existing) return existing as DepositRedemptionVaultAssetConfiguration;

  const redemptionVault = await getOrCreateRedemptionVault(
    context,
    chainId,
    redemptionVaultAddress,
  );
  const facility = await getOrCreateDepositFacility(context, chainId, facilityAddress);
  const depositAsset = await getOrCreateDepositAsset(context, chainId, depositAssetAddress);

  // Fetch the data from the contract
  const interestRate = await context.effect(fetchRedemptionVaultInterestRate, {
    chainId,
    vaultAddress: redemptionVaultAddress,
    facilityAddress,
    assetAddress: depositAssetAddress,
  });
  const maxBorrowPercentage = await context.effect(fetchRedemptionVaultMaxBorrowPercentage, {
    chainId,
    vaultAddress: redemptionVaultAddress,
    facilityAddress,
    assetAddress: depositAssetAddress,
  });

  const created: DepositRedemptionVaultAssetConfiguration = {
    id,
    chainId: chainId,
    redemptionVault_id: redemptionVault.id,
    facility_id: facility.id,
    depositAsset_id: depositAsset.id,
    interestRate: BigInt(interestRate),
    interestRateDecimal: toBpsDecimal(interestRate),
    maxBorrowPercentage: BigInt(maxBorrowPercentage),
    maxBorrowPercentageDecimal: toBpsDecimal(maxBorrowPercentage),
  };
  context.DepositRedemptionVaultAssetConfiguration.set(created);
  return created;
}
