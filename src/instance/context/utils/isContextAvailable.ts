import { ContextType } from "../context";

export function isContextAvailable(
  ctx: ContextType | null,
): ctx is ContextType {
  return ctx !== null;
}
