import { cxt } from "..";
import { isContextAvailable } from "../utils/isContextAvailable";

export function provide(key: string | symbol, value: unknown) {
  if (!isContextAvailable(cxt)) {
    return;
  }

  cxt[key] = value;
}