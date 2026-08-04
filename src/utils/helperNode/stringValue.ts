import { Computed } from "../../core/reactive/computed/index.js";
import { State } from "../../core/reactive/state/index.js";
import { getType } from "../../core/utlils/index.js";

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
