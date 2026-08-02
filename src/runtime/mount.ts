import { ComponentView } from "../components/component";
import {
  isPrimitiveChild,
  isSlot,
  isVNode,
  normalizeChildren,
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
