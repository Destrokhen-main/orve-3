import { cxt } from "..";
import { isContextAvailable } from "../utils/isContextAvailable";

export function provide<T>(key: string | symbol, value: T) {
  if (!isContextAvailable(cxt)) {
    return;
  }

  cxt.provide[key] = value;
}