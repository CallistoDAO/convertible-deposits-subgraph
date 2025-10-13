import type { Depositor } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { getAddressId } from "../utils/ids";

export async function getOrCreateDepositor(
  context: HandlerContext,
  chainId: number,
  address: string,
): Promise<Depositor> {
  const id = getAddressId(chainId, address);
  const existing = await context.Depositor.get(id);
  if (existing) return existing as Depositor;
  const created: Depositor = {
    id,
    chainId: chainId,
    address: address.toLowerCase(),
  };
  context.Depositor.set(created);
  return created;
}
