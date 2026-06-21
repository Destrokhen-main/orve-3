import { cxt } from "../context";
import { isContextAvailable } from "../utils/isContextAvailable";

export function inject<T>(key: string | symbol, defaultValue: T) {
  if (!isContextAvailable(cxt)) {
    return defaultValue;
  }

  return (cxt.provide[key] as T) ?? defaultValue;
}