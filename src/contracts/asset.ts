import { experimental_createEffect, S } from "envio";
import { erc20Abi } from "viem";
import { getClient } from "../utils/client";

export const fetchAssetDecimals = experimental_createEffect(
  {
    name: "fetchAssetDecimals",
    input: {
      chainId: S.number,
      address: S.string,
    },
    output: S.number,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const assetAddress = input.address as `0x${string}`;

    const result = await client.readContract({
      address: assetAddress,
      abi: erc20Abi,
      functionName: "decimals",
    });

    return result;
  },
);

export const fetchAssetName = experimental_createEffect(
  {
    name: "fetchAssetName",
    input: {
      chainId: S.number,
      address: S.string,
    },
    output: S.string,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const assetAddress = input.address as `0x${string}`;

    const result = await client.readContract({
      address: assetAddress,
      abi: erc20Abi,
      functionName: "name",
    });

    return result;
  },
);

export const fetchAssetSymbol = experimental_createEffect(
  {
    name: "fetchAssetSymbol",
    input: {
      chainId: S.number,
      address: S.string,
    },
    output: S.string,
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    const assetAddress = input.address as `0x${string}`;

    const result = await client.readContract({
      address: assetAddress,
      abi: erc20Abi,
      functionName: "symbol",
    });

    return result;
  },
);
