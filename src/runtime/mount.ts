import { ComponentView } from "../components/component";
import { getCurrentContext } from "../instance/context";
import {
  isPrimitiveChild,
  isSlot,
  isVNode,
  normalizeChildren,
  readSlot,
  toText,
} from "./jsx";
import { Child, ComponentFn, FRAGMENT, View } from "./types";
import { DynamicView } from "./views/dynamic";
import { ElementView } from "./views/element";
import { FragmentView } from "./views/fragment";
import { TextView } from "./views/text";

/**
 * Единая точка разбора JSX-значения в представление.
 * Общая для обоих режимов: разница только в том, кто и как часто её зовёт.
 */
export function createView(child: Child): View {
  if (isPrimitiveChild(child)) {
    return new TextView(toText(child));
  }

  if (Array.isArray(child)) {
    return new FragmentView(child);
  }

  if (isVNode(child)) {
    if (child.type === FRAGMENT) {
      return new FragmentView(normalizeChildren(child.props.children));
    }

    if (typeof child.type === "string") {
      return new ElementView(child);
    }

    return new ComponentView(child, child.type as ComponentFn);
  }

  // сигнал или тонк — сюда попадает только в сингл-режиме
  if (isSlot(child)) {
    const ctx = getCurrentContext();
    if (ctx && ctx.options.single !== true) {
      console.warn(
        "[orve] Сигнал передан как слот в базовом компоненте — " +
          "такие подписки недопустимы без single. " +
          "Используйте {signal.value} или добавьте defineOptions({ single: true }).",
      );
      // Fallback: читаем текущее значение, результат участвует в render-эффекте
      return createView(readSlot(child));
    }

    return new DynamicView(child);
  }

  return new TextView(toText(child));
}

export function mountChild(
  child: Child,
  parent: Node,
  anchor: Node | null = null,
): View {
  const view = createView(child);
  view.mount(parent, anchor);
  return view;
}
