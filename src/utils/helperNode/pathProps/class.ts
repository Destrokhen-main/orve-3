export function patchClass(el: Element, nextValue: string | null) {
  if (nextValue === null) {
    el.removeAttribute("class");
  } else {
    el.setAttribute("class", nextValue);
  }
}

export function patchSingleClass(el: Element, key: string, nextValue: string) {
  if (typeof key === "string" && key.length === 0) {
    return;
  }

  if (nextValue === null) {
    el.classList.remove(key);

    if (el.classList.length === 0) {
      el.removeAttribute("class");
    }
  } else {
    el.classList.add(key);
  }
}
