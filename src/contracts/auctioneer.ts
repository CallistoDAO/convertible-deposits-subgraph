import { experimental_createEffect, S } from "envio";
import { ConvertibleDepositAuctioneerAbi } from "../abi/ConvertibleDepositAuctioneer";
import { getClient } from "../utils/client";

/**
 * Fetch auctioneer version
 */
export const fetchAuctioneerVersion = experimental_createEffect(
  {
    name: "fetchAuctioneerVersion",
    input: {
      chainId: S.number,
      address: S.string,
    },
    output: S.schema({
      major: S.number,
      minor: S.number,
    }),
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const auctioneerAddress = input.address as `0x${string}`;

    const result = await client.readContract({
      address: auctioneerAddress,
      abi: ConvertibleDepositAuctioneerAbi,
      functionName: "VERSION",
    });

    return {
      major: result[0],
      minor: result[1],
    };
  },
);

export const fetchAuctioneerCurrentTick = experimental_createEffect(
  {
    name: "fetchAuctioneerCurrentTick",
    input: {
      chainId: S.number,
      address: S.string,
      depositPeriod: S.number,
    },
    output: S.schema({
      price: S.bigint,
      capacity: S.bigint,
      lastUpdate: S.number,
    }),
    cache: false, // Don't cache as this changes frequently
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const auctioneerAddress = input.address as `0x${string}`;

    const result = await client.readContract({
      address: auctioneerAddress,
      abi: ConvertibleDepositAuctioneerAbi,
      functionName: "getCurrentTick",
      args: [input.depositPeriod],
    });

    return {
      price: result.price,
      capacity: result.capacity,
      lastUpdate: result.lastUpdate,
    };
  },
);

export const fetchAuctioneerTrackingPeriod = experimental_createEffect(
  {
    name: "fetchAuctioneerTrackingPeriod",
    input: {
      chainId: S.number,
      address: S.string,
    },
    output: S.number,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const auctioneerAddress = input.address as `0x${string}`;

    const result = await client.readContract({
      address: auctioneerAddress,
      abi: ConvertibleDepositAuctioneerAbi,
      functionName: "getAuctionTrackingPeriod",
    });

    return result;
  },
);

export const fetchAuctioneerDepositAsset = experimental_createEffect(
  {
    name: "fetchAuctioneerDepositAsset",
    input: {
      chainId: S.number,
      address: S.string,
    },
    output: S.string,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const auctioneerAddress = input.address as `0x${string}`;

    const result = await client.readContract({
      address: auctioneerAddress,
      abi: ConvertibleDepositAuctioneerAbi,
      functionName: "getDepositAsset",
    });

    return result;
  },
);

export const fetchAuctioneerTickStep = experimental_createEffect(
  {
    name: "fetchAuctioneerTickStep",
    input: {
      chainId: S.number,
      address: S.string,
    },
    output: S.number,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const auctioneerAddress = input.address as `0x${string}`;

    const result = await client.readContract({
      address: auctioneerAddress,
      abi: ConvertibleDepositAuctioneerAbi,
      functionName: "getTickStep",
    });

    return result;
  },
);

export const fetchAuctioneerParameters = experimental_createEffect(
  {
    name: "fetchAuctioneerParameters",
    input: {
      chainId: S.number,
      address: S.string,
    },
    output: S.schema({
      target: S.bigint,
      tickSize: S.bigint,
      minPrice: S.bigint,
    }),
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const auctioneerAddress = input.address as `0x${string}`;

    const result = await client.readContract({
      address: auctioneerAddress,
      abi: ConvertibleDepositAuctioneerAbi,
      functionName: "getAuctionParameters",
    });

    return result;
  },
);
