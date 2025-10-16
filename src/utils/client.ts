import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

const RPC_URL = process.env.RPC_URL;

const getChain = (chainId: number) => {
  if (chainId === 11155111) {
    return sepolia;
  }

  if (chainId === 1) {
    return mainnet;
  }

  throw new Error(`Unsupported chain id: ${chainId}`);
};

export const getClient = (chainId: number) => {
  return createPublicClient({
    chain: getChain(chainId),
    batch: { multicall: true },
    transport: http(RPC_URL, { batch: false }),
  });
};
