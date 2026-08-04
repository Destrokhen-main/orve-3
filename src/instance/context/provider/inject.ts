import { getCurrentContext } from "../context";

export function inject<T>(
  key: string | symbol,
  defaultValue?: T,
): T | undefined {
  let ctx = getCurrentContext();

  while (ctx) {
    if (key in ctx.provide) {
      return ctx.provide[key] as T;
    }
    ctx = ctx.parent;
  }

  return defaultValue;
}
