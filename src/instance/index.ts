import { EffectScope, effectScope } from "../core/reactive";
import { jsx } from "../runtime/jsx";
import { createView } from "../runtime/mount";
import { ComponentFn, View } from "../runtime/types";
import { OrvePlugin } from "./plugins/plugins";
import { OrvePluginType } from "./plugins/types";
import { OrveInstanceType } from "./types";

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

    // корневая область: unmount() гасит всё дерево эффектов разом
    this.scope = effectScope(true);
    this.scope.run(() => {
      this.view = createView(jsx(this.root!, {}));
      this.view.mount(target, null);
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
