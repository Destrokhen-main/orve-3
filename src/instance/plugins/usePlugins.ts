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

/**
 * То же, что usePlugin, но падает, если плагин не установлен.
 * Для случаев, когда компонент без плагина всё равно нерабочий, —
 * лучше явная ошибка, чем undefined, всплывший где-то ниже.
 */
export function requirePlugin<K extends keyof PluginContext>(
  key: K,
): NonNullable<PluginContext[K]> {
  const value = usePlugin(key);

  if (value === undefined || value === null) {
    throw new Error(
      `[orve] Плагин '${String(key)}' не установлен: добавьте его через instance.use().`,
    );
  }

  return value as NonNullable<PluginContext[K]>;
}

/** Проверка наличия плагина без варнинга и без броска. */
export function hasPlugin(key: string): boolean {
  const ctx = getCurrentContext();
  return !!ctx && (ctx.plugins as PluginContext)[key] !== undefined;
}
