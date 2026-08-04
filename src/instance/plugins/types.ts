/**
 * Точка расширения для пользователя: через declaration merging
 * можно описать свои плагины и получить типы внутри setup.
 *
 * declare module 'orve' {
 *   interface OrvePlugins { $router: Router }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OrvePlugins {}

export type PluginContext = OrvePlugins & Record<string, unknown>;

export type OrvePluginType = {
  setup: (instance: PluginContext) => void;
};
