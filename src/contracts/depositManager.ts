import { experimental_createEffect, S } from "envio";
import { DepositManagerAbi } from "../abi/DepositManager";
import { getClient } from "../utils/client";
import { fetchDepositManager } from "./depositFacility";

export const fetchReceiptTokenManager = experimental_createEffect(
  {
    name: "fetchReceiptTokenManager",
    input: {
      chainId: S.number,
      facility: S.string,
    },
    output: S.string,
    cache: true,
  },
  async ({ input, context }) => {
    // Get the DepositManager address
    const depositManager = (await context.effect(fetchDepositManager, {
      chainId: input.chainId,
      facility: input.facility,
    })) as `0x${string}`;

    const client = getClient(input.chainId);

    const result = await client.readContract({
      address: depositManager,
      abi: DepositManagerAbi,
      functionName: "getReceiptTokenManager",
    });

    return result;
  },
);

export const fetchReceiptTokenId = experimental_createEffect(
  {
    name: "fetchReceiptTokenId",
    input: {
      chainId: S.number,
      facility: S.string,
      asset: S.string,
      depositPeriod: S.number,
    },
    output: S.bigint,
    cache: true,
  },
  async ({ input, context }) => {
    // Get the DepositManager address
    const depositManager = (await context.effect(fetchDepositManager, {
      chainId: input.chainId,
      facility: input.facility,
    })) as `0x${string}`;

    const client = getClient(input.chainId);

    const result = await client.readContract({
      address: depositManager,
      abi: DepositManagerAbi,
      functionName: "getReceiptTokenId",
      args: [
        input.asset as `0x${string}`,
        Number(input.depositPeriod),
        input.facility as `0x${string}`,
      ],
    });

    return result;
  },
);
