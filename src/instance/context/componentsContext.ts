import { HOOKS } from "../hook";
import { OrveInstanceType } from "../types";

export function createLocalContext(rootContext: OrveInstanceType) {
  const context: {
    plugins: Record<string, unknown>,
    hooks: {
      [key in HOOKS] ?: () => void
    },
    context: Record<string, unknown>
  } = {
    plugins: rootContext.plugins,
    hooks: {},
    context: {}
  };

  return context;
}