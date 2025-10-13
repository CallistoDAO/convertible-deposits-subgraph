import { experimental_createEffect, S } from "envio";
import { DepositRedemptionVaultAbi } from "../abi/DepositRedemptioNVault";
import { getClient } from "../utils/client";

/**
 * Fetch redemption vault interest rate for an asset
 */
export const fetchRedemptionVaultInterestRate = experimental_createEffect(
  {
    name: "fetchRedemptionVaultInterestRate",
    input: {
      chainId: S.number,
      vaultAddress: S.string,
      facilityAddress: S.string,
      assetAddress: S.string,
    },
    output: S.number,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const vaultAddress = input.vaultAddress as `0x${string}`;
    const facilityAddress = input.facilityAddress as `0x${string}`;
    const assetAddress = input.assetAddress as `0x${string}`;

    const result = await client.readContract({
      address: vaultAddress,
      abi: DepositRedemptionVaultAbi,
      functionName: "getAnnualInterestRate",
      args: [assetAddress, facilityAddress],
    });
    return result;
  },
);

/**
 * Fetch redemption vault max borrow percentage for an asset
 */
export const fetchRedemptionVaultMaxBorrowPercentage = experimental_createEffect(
  {
    name: "fetchRedemptionVaultMaxBorrowPercentage",
    input: {
      chainId: S.number,
      vaultAddress: S.string,
      facilityAddress: S.string,
      assetAddress: S.string,
    },
    output: S.number,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const vaultAddress = input.vaultAddress as `0x${string}`;
    const facilityAddress = input.facilityAddress as `0x${string}`;
    const assetAddress = input.assetAddress as `0x${string}`;

    const result = await client.readContract({
      address: vaultAddress,
      abi: DepositRedemptionVaultAbi,
      functionName: "getMaxBorrowPercentage",
      args: [assetAddress, facilityAddress],
    });
    return result;
  },
);

/**
 * Fetch claim default reward percentage
 */
export const fetchClaimDefaultRewardPercentage = experimental_createEffect(
  {
    name: "fetchClaimDefaultRewardPercentage",
    input: {
      chainId: S.number,
      vaultAddress: S.string,
    },
    output: S.number,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const vaultAddress = input.vaultAddress as `0x${string}`;

    const result = await client.readContract({
      address: vaultAddress,
      abi: DepositRedemptionVaultAbi,
      functionName: "getClaimDefaultRewardPercentage",
    });
    return result;
  },
);

/**
 * Fetch redemption for a user and redemption id
 */
export const fetchRedemption = experimental_createEffect(
  {
    name: "fetchRedemption",
    input: {
      chainId: S.number,
      vaultAddress: S.string,
      userAddress: S.string,
      redemptionId: S.number,
    },
    output: S.schema({
      depositToken: S.string,
      depositPeriod: S.number,
      redeemableAt: S.number,
      amount: S.bigint,
      facility: S.string,
      positionId: S.bigint,
    }),
    cache: false,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const vaultAddress = input.vaultAddress as `0x${string}`;
    const userAddress = input.userAddress as `0x${string}`;
    const redemptionId = input.redemptionId;

    const result = await client.readContract({
      address: vaultAddress,
      abi: DepositRedemptionVaultAbi,
      functionName: "getUserRedemption",
      args: [userAddress, redemptionId],
    });

    return result;
  },
);

/**
 * Fetch loan for a redemption
 */
export const fetchLoan = experimental_createEffect(
  {
    name: "fetchLoan",
    input: {
      chainId: S.number,
      vaultAddress: S.string,
      userAddress: S.string,
      redemptionId: S.number,
    },
    output: S.schema({
      initialPrincipal: S.bigint,
      principal: S.bigint,
      interest: S.bigint,
      dueDate: S.number,
      isDefaulted: S.boolean,
    }),
    cache: false, // Don't cache as this changes
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const vaultAddress = input.vaultAddress as `0x${string}`;
    const userAddress = input.userAddress as `0x${string}`;
    const redemptionId = input.redemptionId;

    const result = await client.readContract({
      address: vaultAddress,
      abi: DepositRedemptionVaultAbi,
      functionName: "getRedemptionLoan",
      args: [userAddress, redemptionId],
    });
    return result;
  },
);
