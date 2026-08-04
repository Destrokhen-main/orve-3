import { getCurrentContext } from "../context";
import { ComponentOptions } from "./types";

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
