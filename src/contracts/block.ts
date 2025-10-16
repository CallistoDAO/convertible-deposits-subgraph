import { experimental_createEffect, S } from "envio";
import { getClient } from "../utils/client";

export const fetchBlockTimestamp = experimental_createEffect(
  {
    name: "fetchBlockTimestamp",
    input: {
      chainId: S.number,
      blockNumber: S.number,
    },
    output: S.bigint,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);

    const block = await client.getBlock({
      blockNumber: BigInt(input.blockNumber),
    });

    return block.timestamp;
  },
);
