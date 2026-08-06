export function patchImage(el: any, nextValue: string | null) {
  if (nextValue === null) {
    el.removeAttribute("src");
  } else {
    el.src = nextValue;
  }
}
