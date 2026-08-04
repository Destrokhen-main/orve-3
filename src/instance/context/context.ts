import { ComponentOptions } from "./defines/types";

export type ContextType = {
  provide: Record<string | symbol, unknown>;
  options: ComponentOptions;
  parent: ContextType | null;
};

const stack: ContextType[] = [];

export function createContext(parent: ContextType | null): ContextType {
  return {
    provide: {},
    options: {} as ComponentOptions,
    parent,
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
