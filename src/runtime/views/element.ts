import { Effect, effect, untrack } from "../../core/reactive/index.js";
import {
  EventValue,
  addListener,
  applyProp,
  applyRef,
  createEl,
  isEventProp,
  isInternalProp,
  removeListener,
} from "../dom.js";
import { isSlot, isVNode, normalizeChildren, readSlot } from "../jsx.js";
import { createView } from "../mount.js";
import { NS, childNS, elementNS, getNS, withNS } from "../namespace.js";
import { patchChildren } from "../patch.js";
import { Child, Props, Slot, View, VNode } from "../types.js";
import { BaseView } from "./base.js";

type Binding = { source: Slot; effect: Effect<void>; prev: unknown };

export class ElementView extends BaseView {
  private el: Element | null = null;
  private children: View[] = [];
  private props: Props;

  /** Пространство имён фиксируется при создании: дети досоздаются и позже. */
  private ns: NS = getNS();
  private innerNS: NS = "html";

  /** Пропы под собственным эффектом — сигнал или тонк. */
  private bindings = new Map<string, Binding>();
  private listeners = new Map<string, EventValue>();

  constructor(private vnode: VNode) {
    super();
    this.key = vnode.key;
    this.props = vnode.props;
  }

  mount(parent: Node, anchor: Node | null) {
    const tag = this.vnode.type as string;

    this.parentNode = parent;
    this.innerNS = childNS(tag, this.ns);
    // сам тег может открывать новое пространство: <svg> внутри html
    this.ns = elementNS(tag, this.ns);
    this.el = createEl(tag, this.ns);

    this.scope.run(() => {
      for (const key of Object.keys(this.props)) {
        this.bindProp(key, this.props[key]);
      }

      withNS(this.innerNS, () => {
        this.children = normalizeChildren(this.props.children).map(createView);
        this.children.forEach((child) => child.mount(this.el!, null));
      });
    });

    parent.insertBefore(this.el, anchor);
    this.mounted = true;

    applyRef(this.props.ref, this.el);
  }

  update(next: Child): boolean {
    if (
      !isVNode(next) ||
      next.type !== this.vnode.type ||
      next.key !== this.key
    ) {
      return false;
    }

    this.scope.run(() => {
      this.patchProps(next.props);

      withNS(this.innerNS, () => {
        this.children = patchChildren(
          this.el!,
          null,
          this.children,
          normalizeChildren(next.props.children),
        );
      });
    });

    this.vnode = next;
    this.props = next.props;
    return true;
  }

  nodes(): Node[] {
    return this.el ? [this.el] : [];
  }

  unmount() {
    applyRef(this.props.ref, null);

    // узел могли удержать через ref — не оставляем на нём живых слушателей
    this.listeners.forEach((value, key) => removeListener(this.el!, key, value));
    this.listeners.clear();

    this.children.forEach((child) => child.unmount());
    this.children = [];
    super.unmount();

    this.el?.parentNode?.removeChild(this.el);
    this.el = null;
  }

  private bindProp(key: string, value: unknown) {
    if (isInternalProp(key)) {
      return;
    }

    if (isEventProp(key)) {
      if (typeof value === "function" || Array.isArray(value)) {
        addListener(this.el!, key, value as EventValue);
        this.listeners.set(key, value as EventValue);
      }
      return;
    }

    // сигнал или тонк — точечная привязка к атрибуту
    if (isSlot(value)) {
      const binding: Binding = {
        source: value,
        prev: undefined,
        effect: null as unknown as Effect<void>,
      };

      binding.effect = effect(() => {
        const resolved = readSlot(value);
        untrack(() => {
          applyProp(this.el!, key, resolved, binding.prev, this.ns);
          binding.prev = resolved;
        });
      });

      this.bindings.set(key, binding);
      return;
    }

    applyProp(this.el!, key, value, undefined, this.ns);
  }

  private patchProps(nextProps: Props) {
    for (const key of Object.keys(nextProps)) {
      if (isInternalProp(key)) {
        continue;
      }

      const next = nextProps[key];
      const prev = this.props[key];

      if (isEventProp(key)) {
        if (prev === next) {
          continue;
        }
        this.removeProp(key);
        this.bindProp(key, next);
        continue;
      }

      const binding = this.bindings.get(key);
      if (binding) {
        // тот же сигнал — его эффект уже всё делает сам
        if (binding.source === next) {
          continue;
        }
        this.removeProp(key);
        this.bindProp(key, next);
        continue;
      }

      if (isSlot(next)) {
        this.bindProp(key, next);
        continue;
      }

      if (prev !== next) {
        applyProp(this.el!, key, next, prev, this.ns);
      }
    }

    for (const key of Object.keys(this.props)) {
      if (!(key in nextProps)) {
        this.removeProp(key);
      }
    }

    if (nextProps.ref !== this.props.ref) {
      applyRef(this.props.ref, null);
      applyRef(nextProps.ref, this.el);
    }
  }

  private removeProp(key: string) {
    const listener = this.listeners.get(key);
    if (listener) {
      removeListener(this.el!, key, listener);
      this.listeners.delete(key);
      return;
    }

    const binding = this.bindings.get(key);
    if (binding) {
      binding.effect.stop();
      this.bindings.delete(key);
    }

    if (!isInternalProp(key)) {
      applyProp(this.el!, key, null, this.props[key], this.ns);
    }
  }
}
