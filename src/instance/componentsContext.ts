import { OrveInstanceType } from "./types";

export function createLocalContext(rootContext: OrveInstanceType) {
  const context = {
    plugins: rootContext.plugins,
    hooks: [],
    context: {}
  };

  return context;
}