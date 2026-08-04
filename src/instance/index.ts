import { EffectScope, effectScope } from "../core/reactive/index.js";
import { jsx } from "../runtime/jsx.js";
import { createView } from "../runtime/mount.js";
import { ComponentFn, View } from "../runtime/types.js";
import { createContext, withContext } from "./context/context.js";
import { OrvePlugin } from "./plugins/plugins.js";
import { OrvePluginType } from "./plugins/types.js";
import { OrveInstanceType } from "./types.js";

export class OrveInstance {
  private instance: OrveInstanceType = {
    plugins: {},
  };

  private root: ComponentFn | null = null;
  private view: View | null = null;
  private scope: EffectScope | null = null;

  use(plugin: OrvePluginType) {
    const _plugin = new OrvePlugin(this.instance.plugins, plugin);

    this.instance.plugins = {
      ...this.instance.plugins,
      ..._plugin.pluginContext,
    };
    return this;
  }

  _getPlugins() {
    return this.instance.plugins;
  }

  rootComponent(app: ComponentFn<any>) {
    this.root = app;
    return this;
  }

  mountRoot(el: HTMLElement | string) {
    const target = typeof el === "string" ? document.querySelector(el) : el;

    if (!target) {
      throw new Error(`[orve] Не найден контейнер для монтирования: ${el}`);
    }

    if (!this.root) {
      throw new Error(
        "[orve] Корневой компонент не задан: вызовите rootComponent()",
      );
    }

    // корневой контекст инстанса: держит плагины, дальше они наследуются
    // всеми контекстами компонентов вниз по дереву
    const rootCtx = createContext(null, this.instance.plugins);

    // корневая область: unmount() гасит всё дерево эффектов разом
    this.scope = effectScope(true);
    this.scope.run(() => {
      withContext(rootCtx, () => {
        this.view = createView(jsx(this.root!, {}));
        this.view.mount(target, null);
      });
    });

    return this;
  }

  unmount() {
    this.view?.unmount();
    this.scope?.stop();
    this.view = null;
    this.scope = null;
    return this;
  }
}

export function createInstance() {
  return new OrveInstance();
}
