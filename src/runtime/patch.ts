import { isVNode } from "./jsx";
import { createView } from "./mount";
import { Child, Key, View } from "./types";

/**
 * Обновить представление или заменить его. Один и тот же реконсилятор
 * работает и в базовом режиме (всё дерево компонента), и в сингле
 * (внутри отдельного реактивного слота).
 */
export function patch(
  view: View,
  next: Child,
  parent: Node,
  anchor: Node | null,
): View {
  if (view.update(next)) {
    return view;
  }

  const replacement = createView(next);
  replacement.mount(parent, view.first() ?? anchor);
  view.unmount();
  return replacement;
}

function keyOf(child: Child): Key {
  return isVNode(child) ? child.key : null;
}

/**
 * Сопоставление списка детей. Узлы с `key` ищутся по ключу, остальные —
 * по позиции. Уцелевшие переиспользуются, лишние размонтируются,
 * порядок доводится минимальным числом перестановок.
 */
export function patchChildren(
  parent: Node,
  anchor: Node | null,
  oldViews: View[],
  nextChildren: Child[],
): View[] {
  const keyed = new Map<Key, View>();
  const free: View[] = [];

  for (const view of oldViews) {
    if (view.key !== null && !keyed.has(view.key)) {
      keyed.set(view.key, view);
    } else {
      free.push(view);
    }
  }

  const used = new Set<View>();
  const result: View[] = new Array(nextChildren.length);
  let freeCursor = 0;

  nextChildren.forEach((child, index) => {
    const key = keyOf(child);
    let candidate: View | undefined;

    if (key !== null) {
      candidate = keyed.get(key);
    } else {
      // непомеченные узлы сопоставляются по порядку следования
      while (freeCursor < free.length && used.has(free[freeCursor])) {
        freeCursor++;
      }
      candidate = free[freeCursor];
    }

    if (candidate && !used.has(candidate) && candidate.update(child)) {
      used.add(candidate);
      if (key === null) {
        freeCursor++;
      }
      result[index] = candidate;
      return;
    }

    result[index] = createView(child);
  });

  for (const view of oldViews) {
    if (!used.has(view)) {
      view.unmount();
    }
  }

  position(parent, anchor, result);
  return result;
}

/** Пройти список с конца, вставляя/двигая только то, что стоит не на месте. */
function position(parent: Node, anchor: Node | null, views: View[]) {
  let next = anchor;

  for (let i = views.length - 1; i >= 0; i--) {
    const view = views[i];
    const nodes = view.nodes();

    if (nodes.length === 0) {
      view.mount(parent, next);
      const mounted = view.nodes();
      next = mounted[0] ?? next;
      continue;
    }

    const last = nodes[nodes.length - 1];
    if (last.nextSibling !== next) {
      nodes.forEach((node) => parent.insertBefore(node, next));
    }

    next = nodes[0] ?? next;
  }
}
