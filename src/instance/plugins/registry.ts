import { OrvePlugin } from "./plugins.js";
import { OrvePluginInput, PluginContext, PluginHost } from "./types.js";

/**
 * Реестр плагинов инстанса.
 *
 * Отвечает за три вещи, которых нет в самом OrvePlugin:
 *  - порядок установки (плагин видит контекст всех предыдущих);
 *  - дедупликация — один и тот же плагин/имя ставится один раз;
 *  - жизненный цикл: mount() и unmount() инстанса транслируются в хуки.
 */
export class PluginRegistry {
  private context: PluginContext = {} as PluginContext;
  private records: OrvePlugin<any>[] = [];
  private byName = new Map<string, OrvePlugin<any>>();
  private installed = new Set<OrvePluginInput<any>>();
  private mounted = false;

  constructor(private host: PluginHost) {}

  getContext(): PluginContext {
    return this.context;
  }

  has(name: string): boolean {
    return this.byName.has(name);
  }

  get<K extends keyof PluginContext>(key: K): PluginContext[K] | undefined {
    return this.context[key];
  }

  install<O>(plugin: OrvePluginInput<O>, options?: O): void {
    if (this.installed.has(plugin)) {
      console.warn("[orve] Плагин уже установлен в этот инстанс — пропущено.");
      return;
    }

    const record = new OrvePlugin<O>(this.context, plugin, options, this.host, {
      has: (name) => this.has(name),
    });

    if (record.failed || !record.pluginContext) return;

    if (this.byName.has(record.name)) {
      console.warn(
        `[orve] Плагин "${record.name}" уже установлен — пропущено.`,
      );
      return;
    }

    // контекст пересоздаётся, а не мутируется: уже созданные компоненты
    // держат ссылку на прежний объект и не должны видеть поздние плагины
    this.context = { ...this.context, ...record.pluginContext };
    this.records.push(record);
    this.byName.set(record.name, record);
    this.installed.add(plugin);

    // плагин, поставленный после mountRoot(), получает свой onMounted сразу
    if (this.mounted) record.runMounted();
  }

  /** Вызывается инстансом после монтирования корневого компонента. */
  mount(): void {
    if (this.mounted) return;
    this.mounted = true;

    for (const record of this.records) record.runMounted();
  }

  /** Вызывается инстансом при unmount: хуки идут в обратном порядке. */
  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;

    for (let i = this.records.length - 1; i >= 0; i--) {
      this.records[i].dispose();
    }
  }
}
