import { Computed } from "../../core/reactive/computed";
import { State } from "../../core/reactive/state";
import { getType } from "../../core/utlils";

const PRIMITIVE = ["string", "number", "boolean"];

export function stringValue(item: unknown) {
  if (PRIMITIVE.includes(typeof item)) {
    return String(item);
  }
  if (item instanceof State || item instanceof Computed) {
    return stringValue(item.value);
  }
  const type = getType(item);
  if (type === "object" || type === "array") {
    return JSON.stringify(item);
  }
  return "";
}
