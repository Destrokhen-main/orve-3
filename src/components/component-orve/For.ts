import { State, state, untrack } from "../../core/reactive/index.js";
import { defineOptions } from "../../index.js";
import { getCurrentContext } from "../../instance/context/index.js";
import { isVNode, jsx, resolve } from "../../runtime/jsx.js";
import { Child, FRAGMENT, Key, MaybeReactive } from "../../runtime/types.js";

export type ForProps<T = any> = {
  /** Массив, сигнал или тонк — разворачиваются все три варианта. */
  each: MaybeReactive<T[]> | (() => T[]);
  /**
   * Стабильный идентификатор строки. Без него строки сопоставляются по ссылке
   * на сам `item`, поэтому иммутабельное обновление (`list.map(t => ({...t}))`)
   * пересоздаёт строку целиком. С `by` строка переживает замену объекта.
   *
   * Названо не `key`: этот проп зарезервирован JSX-рантаймом — он вынимается
   * из props и попадает в `vnode.key`, до компонента не доходя.
   */
  by?: (item: T, index: number) => Key;
  children: (item: State<T>, index: State<number>) => Child;
};

/**
 * Одна строка списка. `child` создаётся ровно один раз и дальше не меняется —
 * всё, что в строке зависит от данных, читает `item`/`index` как сигналы.
 */
type Row<T> = {
  item: State<T>;
  index: State<number>;
  child: Child;
};

/** Ключ, которым помечается корень строки: свой, поэтому уникален и стабилен. */
const rowKey = (id: number): Key => `orve:row:${id}`;

/**
 * Помечает корень строки ключом, чтобы реконсилятор двигал строку целиком,
 * а не сопоставлял её по позиции. Не-VNode (массив, тонк, примитив) оборачивается
 * во фрагмент — ему тоже нужен носитель ключа.
 */
function withKey(child: Child, key: Key): Child {
  if (isVNode(child)) {
    return child.key === key ? child : { ...child, key };
  }
  return jsx(FRAGMENT, { children: child }, key);
}

/**
 * Список для сингл-режима.
 *
 * Колбэк строки вызывается один раз за её жизнь и получает `item`/`index`
 * сигналами. Изменение массива не пересобирает строки: уцелевшие получают
 * новое значение в сигнал, и обновляется только та часть DOM, которая это
 * значение читает. Пересоздаются лишь строки с новым идентификатором.
 */
export const For = <T>(props: ForProps<T>) => {
  const ctx = getCurrentContext();

  if (!ctx?.parent?.options.single) {
    console.warn("[orve] - Использование For в base комопнентах.");
  }

  defineOptions({
    single: true,
  });

  let rows = new Map<unknown, Row<T>>();
  let nextRowId = 0;

  const createRow = (item: T, index: number): Row<T> => {
    const itemState = state(item);
    const indexState = state(index);
    const children = props.children as ForProps<T>["children"];

    return {
      item: itemState,
      index: indexState,
      child: withKey(children(itemState, indexState), rowKey(nextRowId++)),
    };
  };

  return () => () => {
    // читается под подпиской — это и есть зависимость слота
    const list = resolve<T[]>(props.each) ?? [];

    // сама пересборка ничего трекать не должна: она пишет в сигналы строк
    return untrack(() => {
      const alive = new Map<unknown, Row<T>>();
      const children: Child[] = new Array(list.length);
      const identify = props.by as ForProps<T>["by"];

      list.forEach((item, index) => {
        const id = identify ? identify(item, index) : item;
        const reused = alive.has(id) ? undefined : rows.get(id);
        let row: Row<T>;

        if (reused) {
          // строка живёт дальше: меняется только содержимое её сигналов
          reused.item.set(() => item);
          reused.index.set(index);
          row = reused;
        } else {
          if (alive.has(id)) {
            console.warn(
              `[orve] For: повторяющийся ключ строки (${String(id)}) — ` +
                "строка будет пересоздана. Ключи должны быть уникальны.",
            );
          }
          row = createRow(item, index);
        }

        alive.set(id, row);
        children[index] = row.child;
      });

      rows = alive;
      return children;
    });
  };
};
