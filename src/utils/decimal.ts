import { BigDecimal } from "generated";

export function toDecimal(value: bigint | number, decimals: number): BigDecimal {
  const numerator = new BigDecimal(value.toString());
  const denominator = new BigDecimal((10n ** BigInt(decimals)).toString());

  return numerator.div(denominator);
}

export function toOhmDecimal(value: bigint | number): BigDecimal {
  return toDecimal(value, 9);
}

export function toBpsDecimal(value: bigint | number): BigDecimal {
  return toDecimal(value, 4);
}
