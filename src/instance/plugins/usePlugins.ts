import { getCurrentContext } from "../context/context.js";
import { PluginContext } from "./types.js";

/**
 * Доступ к плагинам инстанса изнутри setup компонента.
 * Вне setup вернёт пустой объект — контекста ещё/уже нет.
 */
export function usePlugins(): PluginContext {
  const ctx = getCurrentContext();

  if (!ctx) {
    console.warn(
      "[orve] usePlugins вызван вне setup компонента — плагины недоступны.",
    );
    return {} as PluginContext;
  }

  return ctx.plugins as PluginContext;
}

export function usePlugin<K extends keyof PluginContext>(
  key: K,
): PluginContext[K] | undefined {
  const ctx = getCurrentContext();

  if (!ctx) {
    console.warn(
      `[orve] usePlugin('${String(key)}') вызван вне setup компонента.`,
    );
    return undefined;
  }

  return (ctx.plugins as PluginContext)[key];
}
