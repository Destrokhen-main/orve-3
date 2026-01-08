import { JSX } from "react";
import { getType } from "../../../core/utlils";

export function isJsx(item: unknown): item is JSX.Element {
  if (getType(item) !== "object") {
    return false;
  }
  const jsx = item as Record<string, any>;
  if (jsx.type === undefined) {
    return false;
  }

  return true;
}
