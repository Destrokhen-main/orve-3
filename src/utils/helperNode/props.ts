import { patchClass } from "./pathProps/class.js";
import { patchImage } from "./pathProps/image.js";
import { patchListener } from "./pathProps/listener.js";
import { patchStyle } from "./pathProps/style.js";

export function patchProps(
  el: any,
  key: string,
  prevValue: any,
  nextValue: any,
  // namespace?: "svg" | "mathml",
  // prevChildren?: any[],
  // parentComponent?: any | null,
  // parentSuspense?: any | null,
  // unmountChildren?: any,
) {
  if (key === "style") {
    patchStyle(el, nextValue);
  } else if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "src") {
    patchImage(el, nextValue);
  } else if (nextValue === null) {
    el.removeAttribute(key);
  } else if (key === "value") {
    el.value = nextValue;
  } else if (typeof nextValue === "boolean") {
    if (nextValue) {
      el.setAttribute(key, "");
    } else {
      el.removeAttribute(key);
    }
  } else if (typeof nextValue === "function" && key.startsWith("on")) {
    patchListener(el, key, prevValue, nextValue);
  } else {
    el.setAttribute(key, nextValue);
  }
}
