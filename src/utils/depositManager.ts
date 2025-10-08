import { experimental_createEffect, S } from "envio";

import { getClient } from "./client";
import { fetchDepositManager } from "./depositFacility";
import { DepositManagerAbi } from "../abi/DepositManager";

export const fetchReceiptTokenManager = experimental_createEffect(
    {
        name: "fetchReceiptTokenManager",
        input: {
            chainId: S.bigint,
            facility: S.string,
        },
        output: S.string,
        cache: true,
    },
    async ({ input, context }) => {
        // Get the DepositManager address
        const depositManager = await context.effect(fetchDepositManager, {
            chainId: input.chainId,
            facility: input.facility,
        }) as `0x${string}`;

        const client = getClient(input.chainId);

        const result = await client.readContract({
            address: depositManager,
            abi: DepositManagerAbi,
            functionName: "getReceiptTokenManager",
        });

        return result;
    }
);

export const fetchReceiptTokenId = experimental_createEffect(
    {
        name: "fetchReceiptTokenId",
        input: {
            chainId: S.bigint,
            facility: S.string,
            asset: S.string,
            depositPeriod: S.bigint,
        },
        output: S.bigint,
        cache: true,
    },
    async ({ input, context }) => {
        // Get the DepositManager address
        const depositManager = await context.effect(fetchDepositManager, {
            chainId: input.chainId,
            facility: input.facility,
        }) as `0x${string}`;

        const client = getClient(input.chainId);

        const result = await client.readContract({
            address: depositManager,
            abi: DepositManagerAbi,
            functionName: "getReceiptTokenId",
            args: [input.asset as `0x${string}`, Number(input.depositPeriod), input.facility as `0x${string}`],
        });

        return result;
    }
);
