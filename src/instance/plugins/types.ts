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

/** Функция, которую setup может вернуть — вызовется при unmount инстанса. */
export type PluginCleanup = () => void;

/**
 * Минимальный контракт инстанса, доступный плагину.
 * Описан структурно, чтобы не тянуть OrveInstance и не ловить цикл импортов.
 */
export type PluginHost = {
  use(plugin: OrvePluginInput<any>, options?: unknown): PluginHost;
  _getPlugins(): PluginContext;
};

/**
 * API второго аргумента setup. Первый аргумент оставлен как есть —
 * это сам контекст плагинов, его можно мутировать напрямую.
 */
export type PluginApi<O = unknown> = {
  /** Имя плагина: из plugin.name либо сгенерированное. */
  readonly name: string;
  /** Опции, переданные вторым аргументом в instance.use(). */
  readonly options: O;
  /** Инстанс, в который ставится плагин. */
  readonly instance: PluginHost;

  /** Типобезопасная альтернатива прямой мутации контекста. */
  provide<K extends keyof PluginContext>(key: K, value: PluginContext[K]): void;
  /** Установлен ли плагин с таким именем (для зависимостей между плагинами). */
  has(name: string): boolean;

  /** Вызовется после монтирования корневого компонента. */
  onMounted(fn: () => void): void;
  /** Вызовется при unmount инстанса, в порядке, обратном установке. */
  onUnmounted(fn: () => void): void;
};

export type PluginSetup<O = unknown> = (
  context: PluginContext,
  api: PluginApi<O>,
) => PluginCleanup | void;

export type OrvePluginType<O = unknown> = {
  /** Имя нужно для дедупликации и для api.has() в других плагинах. */
  name?: string;
  setup: PluginSetup<O>;
};

/** Плагин можно передать объектом или просто функцией setup. */
export type OrvePluginInput<O = unknown> = OrvePluginType<O> | PluginSetup<O>;
