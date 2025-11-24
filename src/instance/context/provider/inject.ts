import { cxt } from "../context";
import { isContextAvailable } from "../utils/isContextAvailable";

export function inject(key: string | symbol, defaultValue: unknown) {
  if (!isContextAvailable(cxt)) {
    return defaultValue;
  }

  return cxt[key] ?? defaultValue;
}