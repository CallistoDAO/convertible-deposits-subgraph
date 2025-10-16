import { onBlock } from "generated";
import { getOrCreateAuctioneerSnapshot, getOrCreateFacilitySnapshot } from "../entities/snapshot";
import { getAddressId } from "../utils/ids";
import {
  getAuctioneerAddressesFromConfig,
  getFacilityAddressesFromConfig,
} from "../utils/snapshot";

// TODO add chain definition for mainnet

onBlock(
  {
    name: "snapshot",
    chain: 11155111,
    interval: 3000, // 1 hour at 12 second blocks
  },
  async ({ block, context }) => {
    context.log.info(`Processing block ${block.number} on chain ${block.chainId}`);

    const auctioneerAddresses = getAuctioneerAddressesFromConfig(block.chainId);
    for (const address of auctioneerAddresses) {
      const auctioneer = await context.Auctioneer.get(getAddressId(block.chainId, address));
      if (!auctioneer || !auctioneer.enabled) continue;

      await getOrCreateAuctioneerSnapshot(context, block.chainId, block.number, auctioneer);
    }

    const facilityAddresses = getFacilityAddressesFromConfig(block.chainId);
    for (const address of facilityAddresses) {
      const facility = await context.DepositFacility.get(getAddressId(block.chainId, address));
      if (!facility || !facility.enabled) continue;

      await getOrCreateFacilitySnapshot(context, block.chainId, block.number, facility);
    }
  },
);
