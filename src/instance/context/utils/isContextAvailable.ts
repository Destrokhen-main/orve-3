import { ContextType } from "../context.js";

export function isContextAvailable(
  ctx: ContextType | null,
): ctx is ContextType {
  return ctx !== null;
}
