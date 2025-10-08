export function buildEntityId(parts: Array<string | number | bigint>): string {
  return parts.map((p) => p.toString()).join("_");
}

export function getBlockId(chainId: number | bigint, blockNumber: number | bigint, logIndex?: number | bigint): string {
  const segments: Array<string | number | bigint> = [chainId, blockNumber];
  if (logIndex !== undefined) segments.push(logIndex);
  return buildEntityId(segments);
}

export function getAddressId(chainId: number | bigint, address: string): string {
  return buildEntityId([chainId, address.toLowerCase()]);
}

export function getPositionId(chainId: number | bigint, positionId: number | bigint): string {
  return buildEntityId([chainId, positionId]);
}

export function getReceiptTokenId(
  chainId: number | bigint,
  receiptTokenManager: string,
  receiptTokenId: number | bigint
): string {
  return buildEntityId([chainId, receiptTokenManager.toLowerCase(), receiptTokenId]);
}

export function pickTxHash(maybeHash: string | undefined): string | undefined {
  return maybeHash?.toLowerCase();
}

