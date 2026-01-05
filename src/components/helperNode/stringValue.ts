import { Computed } from "../../core/reactive/computed";
import { State } from "../../core/reactive/state";
import { getType } from "../../core/utlils";

export function stringValue(item: unknown) {
  if (typeof item === "string") {
    return item;
  }
  if (item instanceof State || item instanceof Computed) {
    return item.get();
  }
  const type = getType(item);
  if (type === "object" || type === "array") {
    return JSON.stringify(item);
  }
  return "";
}
