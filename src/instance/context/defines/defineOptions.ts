import { cxt } from "../context";
import { isContextAvailable } from "../utils/isContextAvailable";
import { ComponentOptions } from "./types";

export function defineOptions(options: ComponentOptions) {
  if (!isContextAvailable(cxt)) {
    console.warn('context not defined');
    return;
  }

  cxt.options = options;
}