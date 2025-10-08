import { createPublicClient, http } from "viem";
import { sepolia, mainnet } from "viem/chains";

const RPC_URL = process.env.RPC_URL;

const getChain = (chainId: bigint) => {
    if (chainId == BigInt(11155111)) {
        return sepolia;
    }

    if (chainId == BigInt(1)) {
        return mainnet;
    }

    throw new Error(`Unsupported chain id: ${chainId}`);
}

export const getClient = (chainId: bigint) => {
    return createPublicClient({
        chain: getChain(chainId),
        batch: { multicall: true },
        transport: http(RPC_URL, { batch: true}),
    })
}
