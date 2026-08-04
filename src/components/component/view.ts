import { effect, untrack } from "../../core/reactive/index.js";
import {
  ContextType,
  createContext,
  getCurrentContext,
  popContext,
  pushContext,
  withContext,
} from "../../instance/context/context.js";
import { isVNode } from "../../runtime/jsx.js";
import { createView } from "../../runtime/mount.js";
import { NS, getNS, withNS } from "../../runtime/namespace.js";
import { patch } from "../../runtime/patch.js";
import { Child, ComponentFn, Render, View, VNode } from "../../runtime/types.js";
import { BaseView } from "../../runtime/views/base.js";
import { createComment } from "../../utils/helperNode/index.js";
import {
  Hooks,
  beginMount,
  createHooks,
  endMount,
  popHooks,
  pushHooks,
  runHooks,
} from "./lifecycle.js";
import { ReactiveProps } from "./props.js";

/**
 * Экземпляр компонента. setup выполняется один раз внутри собственной
 * области эффектов — размонтирование = `scope.stop()`.
 *
 * Разница режимов ровно в двух ветках `mount`:
 *   базовый — render обёрнут в эффект, дерево пересобирается и диффится;
 *   сингл   — render вызывается один раз, реактивность живёт в слотах.
 */
export class ComponentView extends BaseView {
  private anchor: Comment | null = null;
  private root: View | null = null;
  private props: ReactiveProps | null = null;
  private render: Render | null = null;
  private readonly ns: NS = getNS();
  private readonly hooks: Hooks = createHooks();
  private destroyed = false;
  private ctx: ContextType | null = null;

  constructor(
    private vnode: VNode,
    private fn: ComponentFn,
  ) {
    super();
    this.key = vnode.key;
  }

  mount(parent: Node, anchor: Node | null) {
    this.parentNode = parent;
    this.anchor = createComment("");
    parent.insertBefore(this.anchor, anchor);

    // Захватываем родительский контекст и создаём собственный.
    // Это нужно сделать до beginMount, чтобы дочерние компоненты
    // во время applyTree видели корректную цепочку контекстов.
    const parentCtx = getCurrentContext();
    this.ctx = createContext(parentCtx);

    beginMount();
    try {
      this.runScoped(() => {
        this.props = new ReactiveProps(this.vnode.props);

        // setup не должен ничего трекать: это не реактивное вычисление.
        // На время вызова компонент становится текущим — сюда пишут хуки и provide.
        pushHooks(this.hooks);
        pushContext(this.ctx!);
        try {
          this.render = untrack(() => this.fn(this.props!.proxy));
        } finally {
          popHooks();
          popContext();
        }

        if (typeof this.render !== "function") {
          throw new Error("[orve] - Рендер не вернул никакой функции!");
        }

        if (this.ctx?.options.single) {
          // Сингл: render вызывается один раз, контекст нужен для дочерних setup
          withContext(this.ctx!, () => this.applyTree(untrack(this.render!)));
          return;
        }

        effect(() => {
          const next = this.render!();
          // работа с DOM не должна попадать в зависимости render-эффекта;
          // withContext нужен, чтобы дочерние компоненты в applyTree
          // находили правильную цепочку провайдеров при любом перерендере
          untrack(() =>
            this.runScoped(() =>
              withContext(this.ctx!, () => this.applyTree(next)),
            ),
          );
        });
      });

      this.mounted = true;
    } finally {
      // onMounted откладывается до конца самого внешнего монтирования:
      // только тогда узлы этого поддерева стоят в документе
      endMount(this.hooks.mounted);
    }
  }

  update(next: Child): boolean {
    // тот же самый узел описания — пропсы не менялись
    if (next === this.vnode) {
      return true;
    }

    if (!isVNode(next) || next.type !== this.fn || next.key !== this.key) {
      return false;
    }

    // тот же компонент — не пересоздаём, только обновляем пропсы
    this.props?.patch(next.props);
    this.vnode = next;
    return true;
  }

  nodes(): Node[] {
    const nodes = this.root?.nodes() ?? [];
    return this.anchor ? [...nodes, this.anchor] : nodes;
  }

  unmount() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    // DOM ещё на месте, эффекты ещё живы
    runHooks(this.hooks.beforeUnmounted, "onBeforeUnmounted");

    this.root?.unmount();
    this.root = null;
    super.unmount();
    this.anchor?.parentNode?.removeChild(this.anchor);
    this.anchor = null;

    // узлы сняты, область эффектов остановлена
    runHooks(this.hooks.unmounted, "onUnmounted");
  }

  private applyTree(next: Child) {
    withNS(this.ns, () => {
      if (this.root) {
        this.root = patch(this.root, next, this.parentNode!, this.anchor);
        return;
      }

      this.root = createView(next);
      this.root.mount(this.parentNode!, this.anchor);
    });
  }
}
