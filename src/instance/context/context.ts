import { ComponentOptions } from "./defines/types.js";

export type ContextType = {
  provide: Record<string | symbol, unknown>;
  options: ComponentOptions;
  parent: ContextType | null;
  plugins: Record<string, unknown>;
};

const stack: ContextType[] = [];

export function createContext(
  parent: ContextType | null,
  plugins?: Record<string, unknown>,
): ContextType {
  return {
    provide: {},
    options: {} as ComponentOptions,
    parent,
    // плагины задаются один раз на корне инстанса и наследуются вниз по цепочке
    plugins: plugins ?? parent?.plugins ?? {},
  };
}

export function pushContext(ctx: ContextType): void {
  stack.push(ctx);
}

export function popContext(): void {
  stack.pop();
}

export function getCurrentContext(): ContextType | null {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

export function withContext<T>(ctx: ContextType, fn: () => T): T {
  pushContext(ctx);
  try {
    return fn();
  } finally {
    popContext();
  }
}
