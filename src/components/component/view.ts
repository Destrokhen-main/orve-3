import { effect, untrack } from "../../core/reactive";
import { isVNode } from "../../runtime/jsx";
import { createView } from "../../runtime/mount";
import { NS, getNS, withNS } from "../../runtime/namespace";
import { patch } from "../../runtime/patch";
import { Child, ComponentFn, Render, View, VNode } from "../../runtime/types";
import { BaseView } from "../../runtime/views/base";
import { createComment } from "../../utils/helperNode";
import {
  Hooks,
  beginMount,
  createHooks,
  endMount,
  popHooks,
  pushHooks,
  runHooks,
} from "./lifecycle";
import { ReactiveProps } from "./props";
import { isSingle } from "./single";

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

    beginMount();
    try {
      this.scope.run(() => {
        this.props = new ReactiveProps(this.vnode.props);

        // setup не должен ничего трекать: это не реактивное вычисление.
        // На время вызова компонент становится текущим — сюда пишут хуки.
        pushHooks(this.hooks);
        try {
          this.render = untrack(() => this.fn(this.props!.proxy));
        } finally {
          popHooks();
        }

        if (isSingle(this.fn)) {
          this.applyTree(untrack(this.render));
          return;
        }

        effect(() => {
          const next = this.render!();
          // работа с DOM не должна попадать в зависимости render-эффекта
          untrack(() => this.scope.run(() => this.applyTree(next)));
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
