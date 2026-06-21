import { ComponentOptions } from "./defines/types";

export type ContextType = {
  provide: Record<string | symbol, unknown>,
  options: ComponentOptions;
}

export let cxt: ContextType | null = null;

export function setContext(_cxt: ContextType | null) {
  cxt = _cxt;
}