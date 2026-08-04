import {
  EffectScope,
  effect,
  effectScope,
  onScopeDispose,
  untrack,
} from "../../core/reactive/index.js";
import { createComment } from "../../utils/helperNode/index.js";
import { readSlot } from "../jsx.js";
import { createView } from "../mount.js";
import { NS, getNS, withNS } from "../namespace.js";
import { Child, Slot, View } from "../types.js";
import { BaseView } from "./base.js";

/**
 * Реактивный слот — единственное место, где живёт точечное обновление.
 * Читает сигнал/тонк внутри эффекта и по возможности обновляет уже
 * смонтированное представление, а не пересоздаёт его.
 */
export class DynamicView extends BaseView {
  private anchor: Comment | null = null;
  private current: View | null = null;
  /** Область текущего поддерева: отсоединённая, чтобы не копиться в родителе. */
  private childScope: EffectScope | null = null;
  private readonly ns: NS = getNS();

  constructor(private source: Slot) {
    super();
  }

  mount(parent: Node, anchor: Node | null) {
    this.parentNode = parent;
    this.anchor = createComment("");
    parent.insertBefore(this.anchor, anchor);

    this.scope.run(() => {
      onScopeDispose(() => this.disposeCurrent());

      effect(() => {
        const value = readSlot(this.source);
        // сама работа с DOM не должна попадать в зависимости слота
        untrack(() => this.apply(value));
      });
    });

    this.mounted = true;
  }

  /** Слот пересобирается только если пришёл другой источник. */
  update(next: Child): boolean {
    return next === this.source;
  }

  nodes(): Node[] {
    const nodes = this.current?.nodes() ?? [];
    return this.anchor ? [...nodes, this.anchor] : nodes;
  }

  unmount() {
    super.unmount();
    this.disposeCurrent();
    this.anchor?.parentNode?.removeChild(this.anchor);
    this.anchor = null;
  }

  private apply(value: Child) {
    if (this.current && this.childScope) {
      const updated = this.childScope.run(() => this.current!.update(value));
      if (updated) {
        return;
      }
      this.disposeCurrent();
    }

    this.childScope = effectScope(true);
    this.childScope.run(() => {
      withNS(this.ns, () => {
        this.current = createView(value);
        this.current!.mount(this.parentNode!, this.anchor);
      });
    });
  }

  private disposeCurrent() {
    this.current?.unmount();
    this.childScope?.stop();
    this.current = null;
    this.childScope = null;
  }
}
