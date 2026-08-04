import { EffectScope, effectScope } from "../core/reactive/index.js";
import { jsx } from "../runtime/jsx.js";
import { createView } from "../runtime/mount.js";
import { ComponentFn, View } from "../runtime/types.js";
import { createContext, withContext } from "./context/context.js";
import { PluginRegistry } from "./plugins/registry.js";
import { OrvePluginInput, PluginContext } from "./plugins/types.js";

export class OrveInstance {
  private registry = new PluginRegistry(this);

  private root: ComponentFn | null = null;
  private view: View | null = null;
  private scope: EffectScope | null = null;

  use<O>(plugin: OrvePluginInput<O>, options?: O) {
    this.registry.install(plugin, options);
    return this;
  }

  _getPlugins(): PluginContext {
    return this.registry.getContext();
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
    const rootCtx = createContext(null, this.registry.getContext());

    // корневая область: unmount() гасит всё дерево эффектов разом
    this.scope = effectScope(true);
    this.scope.run(() => {
      withContext(rootCtx, () => {
        this.view = createView(jsx(this.root!, {}));
        this.view.mount(target, null);
      });
    });

    // плагины поднимаются после дерева: их onMounted видит смонтированный DOM
    this.registry.mount();

    return this;
  }

  unmount() {
    // сначала гасим плагины, чтобы их cleanup ещё застал живое дерево
    this.registry.unmount();
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
