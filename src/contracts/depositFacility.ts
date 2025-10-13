import { experimental_createEffect, S } from "envio";

import { ConvertibleDepositFacilityAbi } from "../abi/ConvertibleDepositFacility";
import { getClient } from "../utils/client";

export const fetchDepositManager = experimental_createEffect(
  {
    name: "fetchDepositManager",
    input: {
      chainId: S.number,
      facility: S.string,
    },
    output: S.string,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const facilityAddress = input.facility as `0x${string}`;

    const result = await client.readContract({
      address: facilityAddress,
      abi: ConvertibleDepositFacilityAbi,
      functionName: "DEPOSIT_MANAGER",
    });

    return result;
  },
);

export const fetchDepositFacilityAssetPeriodReclaimRate = experimental_createEffect(
  {
    name: "fetchDepositFacilityAssetPeriodReclaimRate",
    input: {
      chainId: S.number,
      facilityAddress: S.string,
      depositAssetAddress: S.string,
      depositAssetPeriodMonths: S.number,
    },
    output: S.number,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const facilityAddress = input.facilityAddress as `0x${string}`;
    const depositAssetAddress = input.depositAssetAddress as `0x${string}`;
    const depositAssetPeriodMonths = input.depositAssetPeriodMonths;

    const result = await client.readContract({
      address: facilityAddress,
      abi: ConvertibleDepositFacilityAbi,
      functionName: "getAssetPeriodReclaimRate",
      args: [depositAssetAddress, depositAssetPeriodMonths],
    });

    return result;
  },
);

export const fetchDepositFacilityAssetCommittedAmount = experimental_createEffect(
  {
    name: "fetchDepositFacilityAssetCommittedAmount",
    input: {
      chainId: S.number,
      facilityAddress: S.string,
      depositAssetAddress: S.string,
    },
    output: S.bigint,
    cache: false,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const facilityAddress = input.facilityAddress as `0x${string}`;
    const depositAssetAddress = input.depositAssetAddress as `0x${string}`;

    const result = await client.readContract({
      address: facilityAddress,
      abi: ConvertibleDepositFacilityAbi,
      functionName: "getCommittedDeposits",
      args: [depositAssetAddress],
    });

    return result;
  },
);
