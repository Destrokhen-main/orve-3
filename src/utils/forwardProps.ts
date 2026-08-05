import { Props } from "../runtime/types.js";

export function forwardProps(props: Props, skip: (keyof Props)[] = []) {
  const obj: Record<string, unknown> = {};

  for (const key in props) {
    if (skip.includes(key)) {
      continue;
    }

    obj[key] = props[key];
  }

  return obj;
}
