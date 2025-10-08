import { experimental_createEffect, S } from "envio";

import { ConvertibleDepositFacilityAbi } from "../abi/ConvertibleDepositFacility";
import { getClient } from "./client";

export const fetchDepositManager = experimental_createEffect(
    {
        name: "fetchDepositManager",
        input: {
            chainId: S.bigint,
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
        })

        return result;
    }
);
