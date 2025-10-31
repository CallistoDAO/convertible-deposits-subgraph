# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Envio HyperIndex indexer for the Convertible Deposits protocol. It tracks deposit positions, auctions, redemptions, and loans across three main contracts:
- **ConvertibleDepositAuctioneer**: Manages convertible deposit auctions with dynamic tick-based pricing
- **ConvertibleDepositFacility**: Handles deposit creation, conversion, and reclamation
- **DepositRedemptionVault**: Manages redemptions and loans against deposit positions

## Common Commands

**Development:**
```bash
pnpm dev                  # Run local indexer with GraphQL playground at http://localhost:8080 (password: testing)
pnpm codegen              # Generate TypeScript types from schema.graphql and config.yaml
pnpm typecheck            # Type-check without emitting files
pnpm format               # Format code with Biome
pnpm format:check         # Check formatting without changes
pnpm test                 # Run mocha tests
```

**Important:** After modifying `schema.graphql` or `config.yaml`, always run `pnpm codegen` followed by `pnpm typecheck`.

## Architecture

### Data Flow Pattern

1. **Events** → 2. **Handlers** → 3. **Entity Helpers** → 4. **Contract Effects** → 5. **Database**

Handlers (in `src/handlers/`) process blockchain events, use entity helpers (in `src/entities/`) to create/update records, and call contract effects (in `src/contracts/`) when on-chain data is needed.

### Key Architectural Patterns

**Entity ID Construction:**
All entities use consistent ID patterns from `src/utils/ids.ts`:
- Block-based events: `chainId_blockNumber_logIndex`
- Addresses: `chainId_address`
- Positions: `chainId_positionId`
- Redemptions: `chainId_userAddress_redemptionId`

**Decimal Handling:**
The codebase stores both raw `BigInt` values and human-readable decimal equivalents:
- Asset amounts: Use `toDecimal(amount, assetDecimals)` from `src/utils/decimal.ts`
- OHM amounts: Use `toOhmDecimal(amount)` (9 decimals)
- Basis points: Use `toBpsDecimal(bps)` (10000 basis points = 1.0)

**Contract Data Fetching:**
All external contract calls MUST use the Effect API due to `preload_handlers: true` in config.yaml:
```typescript
import { experimental_createEffect, S } from "envio";

export const fetchSomething = experimental_createEffect(
  {
    name: "fetchSomething",
    input: { chainId: S.number, address: S.string },
    output: S.schema({ field: S.string }),
    cache: true,
  },
  async ({ input }) => {
    const client = getClient(input.chainId);
    return await client.readContract({...});
  }
);
```

Consume effects in handlers:
```typescript
const data = await context.effect(fetchSomething, { chainId, address });
```

**Entity Updates:**
Entities are immutable. Always use the spread operator when updating:
```typescript
const entity = await context.MyEntity.get(id);
const updated = {
  ...entity,
  newField: newValue,
};
context.MyEntity.set(updated);
```

**Entity Relationships:**
Link entities using `_id` suffix:
```typescript
context.Position.set({
  id: positionId,
  depositor_id: depositor.id,  // Links to Depositor entity
  facility_id: facility.id,     // Links to DepositFacility entity
});
```

### Core Entity Relationships

```
Asset
  └── DepositAsset (enabled/disabled deposit assets)
      ├── DepositAssetPeriod (3mo, 6mo, etc.)
      │   ├── ReceiptToken (ERC-1155 tokens representing deposits)
      │   ├── ConvertibleDepositPosition (individual user positions)
      │   └── Redemption (redemption requests)
      └── Auctioneer (per-asset auctioneers)
          └── AuctioneerDepositPeriod (tick capacity and price per period)

DepositFacility
  ├── DepositFacilityAsset (committed amounts per asset)
  └── DepositFacilityAssetPeriod (reclaim rates per asset+period)

DepositRedemptionVault
  ├── DepositRedemptionVaultAssetConfiguration (interest rates, borrow limits)
  └── Redemption
      └── RedemptionLoan (loans taken against redemptions)
```

### Position Lifecycle

1. **CreatedDeposit**: User deposits into a facility, creates a position with `initialAmount` and `remainingAmount`
2. **Bid**: User bids in auction, potentially converting part of their position at a `conversionPrice`
3. **ConvertedDeposit**: Position's `remainingAmount` decreases as deposits convert to receipt tokens
4. **RedemptionStarted**: User initiates redemption using receipt tokens
5. **LoanCreated**: Optional loan taken against redemption collateral
6. **RedemptionFinished**: Redemption completes, user receives assets

Note: When positions are converted, the handler fetches all user positions from the contract and updates `remainingAmount` for matching positions (see `depositFacility.handlers.ts:250-265`).

## Critical Implementation Details

**Case Sensitivity:**
- Always lowercase addresses: `address.toLowerCase()`
- Transaction hashes are lowercased: `txHash.toLowerCase()`

**Position Updates:**
The `updatePositionFromContract()` function in `src/entities/position.ts` is used to sync position data from the blockchain. This is called after conversion events to reflect the reduced `remainingAmount`.

**Redemption Position Linking:**
Redemptions may or may not be linked to a position. If `positionId` from contract equals `UINT256_MAX`, the position is undefined (see `src/entities/redemption.ts:59-62`).

**Hardcoded Contract Addresses:**
- `DEPOS = "0xb2c2Bab8023E7AEdc0fB13B10B24CA5Af5CdD16f"` in `src/contracts/position.ts` (DepositPositionManager)

## Outstanding TODOs

From README.md:
- Track balances of receipt tokens
- Handle position splits

## Envio-Specific Rules

**This is NOT a TheGraph subgraph.** Key differences:

1. **No `@entity` decorator** in schema.graphql
2. **Timestamps must be cast:** `BigInt(event.block.timestamp)`
3. **Transaction fields require explicit declaration** in config.yaml under `field_selection`
4. **No direct entity arrays** unless using `@derivedFrom`
5. **Effect API required** for all external calls when `preload_handlers: true`

For comprehensive Envio documentation, see:
- https://docs.envio.dev/docs/HyperIndex-LLM/hyperindex-complete
- Example: https://github.com/enviodev/uniswap-v4-indexer

## Code Style

- Biome formatter with 100 character line width
- Double quotes, semicolons, trailing commas
- TypeScript with strict mode enabled
- Use `type` imports where possible: `import type { Foo } from "bar"`
