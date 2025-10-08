import assert from "assert";
import { 
  TestHelpers,
  ConvertibleDepositAuctioneer_AuctionParametersUpdated
} from "generated";
const { MockDb, ConvertibleDepositAuctioneer } = TestHelpers;

describe("ConvertibleDepositAuctioneer contract AuctionParametersUpdated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ConvertibleDepositAuctioneer contract AuctionParametersUpdated event
  const event = ConvertibleDepositAuctioneer.AuctionParametersUpdated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ConvertibleDepositAuctioneer_AuctionParametersUpdated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ConvertibleDepositAuctioneer.AuctionParametersUpdated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualConvertibleDepositAuctioneerAuctionParametersUpdated = mockDbUpdated.entities.ConvertibleDepositAuctioneer_AuctionParametersUpdated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedConvertibleDepositAuctioneerAuctionParametersUpdated: ConvertibleDepositAuctioneer_AuctionParametersUpdated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      depositAsset: event.params.depositAsset,
      newTarget: event.params.newTarget,
      newTickSize: event.params.newTickSize,
      newMinPrice: event.params.newMinPrice,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualConvertibleDepositAuctioneerAuctionParametersUpdated, expectedConvertibleDepositAuctioneerAuctionParametersUpdated, "Actual ConvertibleDepositAuctioneerAuctionParametersUpdated should be the same as the expectedConvertibleDepositAuctioneerAuctionParametersUpdated");
  });
});
