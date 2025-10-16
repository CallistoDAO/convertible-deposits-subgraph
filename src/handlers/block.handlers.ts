import { onBlock } from "generated";
import { fetchBlockTimestamp } from "../contracts/block";
import {
  getOrCreateAuctioneerSnapshot,
  getOrCreateDepositFacilitySnapshot,
} from "../entities/snapshot";
import { getAddressId } from "../utils/ids";
import {
  getAuctioneerAddressesFromConfig,
  getFacilityAddressesFromConfig,
} from "../utils/snapshot";

// TODO add chain definition for mainnet

[
  {
    chain: 11155111 as const,
    interval: 3000, // 1 hour at 12 second blocks
    startBlock: 9180152, // Activation
  },
].forEach(({ chain, interval, startBlock }) => {
  onBlock(
    {
      name: "snapshot",
      chain: chain,
      interval,
      startBlock,
    },
    async ({ block, context }) => {
      context.log.info(`Processing block ${block.number} on chain ${block.chainId}`);

      const timestamp = await context.effect(fetchBlockTimestamp, {
        chainId: block.chainId,
        blockNumber: block.number,
      });

      const auctioneerAddresses = getAuctioneerAddressesFromConfig(block.chainId);
      for (const address of auctioneerAddresses) {
        const auctioneer = await context.Auctioneer.get(getAddressId(block.chainId, address));
        if (!auctioneer || !auctioneer.enabled) continue;

        await getOrCreateAuctioneerSnapshot(
          context,
          block.chainId,
          block.number,
          timestamp,
          auctioneer,
        );
      }

      const facilityAddresses = getFacilityAddressesFromConfig(block.chainId);
      for (const address of facilityAddresses) {
        const facility = await context.DepositFacility.get(getAddressId(block.chainId, address));
        if (!facility || !facility.enabled) continue;

        await getOrCreateDepositFacilitySnapshot(
          context,
          block.chainId,
          block.number,
          timestamp,
          facility,
        );
      }
    },
  );
});
