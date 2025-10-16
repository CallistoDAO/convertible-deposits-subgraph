import { experimental_createEffect, S } from "envio";
import { DepositPositionManagerAbi } from "../abi/DepositPositionManager";
import { getClient } from "../utils/client";

const DEPOS: `0x${string}` = "0xb2c2Bab8023E7AEdc0fB13B10B24CA5Af5CdD16f";

export const fetchPosition = experimental_createEffect(
  {
    name: "fetchPosition",
    input: {
      chainId: S.number,
      positionId: S.bigint,
    },
    output: S.schema({
      operator: S.string,
      owner: S.string,
      asset: S.string,
      periodMonths: S.number,
      remainingDeposit: S.bigint,
      conversionPrice: S.bigint,
      expiry: S.number,
      wrapped: S.boolean,
      additionalData: S.string,
    }),
    cache: false,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const positionId = input.positionId;
    const position = await client.readContract({
      address: DEPOS,
      abi: DepositPositionManagerAbi,
      functionName: "getPosition",
      args: [positionId],
    });

    return position;
  },
);

export const fetchUserPositionIds = experimental_createEffect(
  {
    name: "fetchUserPositionIds",
    input: {
      chainId: S.number,
      userAddress: S.string,
    },
    output: S.array(S.bigint),
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const positionIds = await client.readContract({
      address: DEPOS,
      abi: DepositPositionManagerAbi,
      functionName: "getUserPositionIds",
      args: [input.userAddress as `0x${string}`],
    });

    return positionIds as bigint[];
  },
);

export const fetchPositions = experimental_createEffect(
  {
    name: "fetchPositions",
    input: {
      chainId: S.number,
      positionIds: S.array(S.bigint),
    },
    output: S.array(
      S.schema({
        operator: S.string,
        owner: S.string,
        asset: S.string,
        periodMonths: S.number,
        remainingDeposit: S.bigint,
        conversionPrice: S.bigint,
        expiry: S.number,
        wrapped: S.boolean,
        additionalData: S.string,
      }),
    ),
    cache: false,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);

    // Create multicall contracts array
    const contracts = input.positionIds.map((positionId) => ({
      address: DEPOS,
      abi: DepositPositionManagerAbi,
      functionName: "getPosition" as const,
      args: [positionId],
    }));

    // Execute multicall
    const positions = await client.multicall({
      contracts,
    });

    // Extract results and filter out any failed calls
    return positions
      .map((result) => result.result)
      .filter((result): result is NonNullable<typeof result> => result !== null);
  },
);
