import { getCurrentContext } from "../context.js";
import { ComponentOptions } from "./types.js";

export function defineOptions(options: ComponentOptions): void {
  const ctx = getCurrentContext();

  if (!ctx) {
    console.warn(
      "[orve] defineOptions вызван вне setup компонента — опции проигнорированы.",
    );
    return;
  }

  ctx.options = options;
}
