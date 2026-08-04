import { getCurrentContext } from "../context.js";

export function provide<T>(key: string | symbol, value: T): void {
  const ctx = getCurrentContext();

  if (!ctx) {
    console.warn(
      "[orve] provide вызван вне setup компонента — значение проигнорировано.",
    );
    return;
  }

  ctx.provide[key] = value;
}
