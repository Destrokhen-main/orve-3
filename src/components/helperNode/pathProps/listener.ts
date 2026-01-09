type AnyFunction = (...args: any[]) => void;

export function patchListener(
  el: Element,
  key: string,
  prevValue: AnyFunction,
  nextValue: AnyFunction,
) {
  if (prevValue) {
    el.removeEventListener(key, prevValue);
  }

  if (nextValue !== null) el.addEventListener(key, nextValue);
}
