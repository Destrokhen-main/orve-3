import {
  OrvePluginInput,
  PluginApi,
  PluginCleanup,
  PluginContext,
  PluginHost,
  PluginSetup,
} from "./types.js";

let uid = 0;

function resolveSetup<O>(plugin: OrvePluginInput<O>): PluginSetup<O> {
  return typeof plugin === "function" ? plugin : plugin.setup;
}

function resolveName<O>(plugin: OrvePluginInput<O>): string {
  const name = plugin.name;
  return name && name.length > 0 ? name : `orve-plugin-${++uid}`;
}

/**
 * Обёртка над одним плагином: изолирует его setup, собирает то, что он положил
 * в контекст, и держит его хуки жизненного цикла.
 *
 * Ошибка в setup не роняет инстанс и не пропускает частичные изменения в
 * общий контекст: setup работает с копией, мерж делает вызывающая сторона
 * и только при успехе.
 */
export class OrvePlugin<O = unknown> {
  readonly name: string;
  /** Контекст после setup. undefined — setup упал, плагин ставить нельзя. */
  pluginContext: PluginContext | undefined;
  readonly failed: boolean;

  private mountedHooks: Array<() => void> = [];
  private unmountedHooks: Array<() => void> = [];
  private disposed = false;

  constructor(
    private instance: PluginContext | Record<string, unknown>,
    private plugin: OrvePluginInput<O>,
    private options?: O,
    private host?: PluginHost,
    private registry?: { has(name: string): boolean },
  ) {
    this.name = resolveName(this.plugin);

    const draft = { ...this.instance } as PluginContext;

    try {
      const cleanup = resolveSetup(this.plugin)(draft, this.createApi(draft));

      if (typeof cleanup === "function") {
        this.unmountedHooks.push(cleanup as PluginCleanup);
      }

      this.pluginContext = draft;
      this.failed = false;
    } catch (err) {
      console.error("[PLUGIN]", `"${this.name}"`, err);
      this.failed = true;
    }
  }

  private createApi(draft: PluginContext): PluginApi<O> {
    return {
      name: this.name,
      options: this.options as O,
      instance: this.host ?? {
        use: () => this.host as PluginHost,
        _getPlugins: () => draft,
      },
      provide: (key, value) => {
        draft[key] = value;
      },
      has: (name: string) => this.registry?.has(name) ?? false,
      onMounted: (fn: () => void) => {
        this.mountedHooks.push(fn);
      },
      onUnmounted: (fn: () => void) => {
        this.unmountedHooks.push(fn);
      },
    };
  }

  /** Хуки монтирования. Ошибка одного хука не мешает остальным. */
  runMounted(): void {
    for (const hook of this.mountedHooks) {
      try {
        hook();
      } catch (err) {
        console.error("[PLUGIN]", `"${this.name}" onMounted`, err);
      }
    }
  }

  /** Хуки размонтирования + cleanup из setup, в обратном порядке. Идемпотентно. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    for (let i = this.unmountedHooks.length - 1; i >= 0; i--) {
      try {
        this.unmountedHooks[i]();
      } catch (err) {
        console.error("[PLUGIN]", `"${this.name}" onUnmounted`, err);
      }
    }
  }
}
