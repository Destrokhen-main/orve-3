import { objectToCss } from "./objectToCss.js";

export function patchStyle(
  el: Element,
  nextValue: string | Record<string, string>,
) {
  if (typeof nextValue === "string") {
    el.setAttribute("style", nextValue);
  }

  if (typeof nextValue === "object") {
    el.setAttribute("style", objectToCss(nextValue));
  }
}

export function patchSingleStyle(
  el: any,
  key: string,
  nextValue: string | null,
) {
  if (nextValue === null) {
    el.style.removeProperty(key);
  }

  el.style[key] = nextValue;
}
