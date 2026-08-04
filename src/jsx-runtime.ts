import type { IntrinsicElementsMap } from "./runtime/jsx-attributes.js";
import type { ComponentFn, Key, MaybeReactive, VNode } from "./runtime/types.js";

export { Fragment, jsx, jsxDEV, jsxs } from "./runtime/jsx.js";

export namespace JSX {
  export type Element = VNode;

  /** Компонент возвращает render-функцию, а не разметку напрямую. */
  export type ElementType = string | ComponentFn<any>;

  export interface ElementChildrenAttribute {
    children: unknown;
  }

  export interface IntrinsicAttributes {
    key?: Key;
  }

  /**
   * Снаружи любой проп можно передать сигналом — рантайм его развернёт.
   * Внутри компонента тип остаётся обычным значением.
   */
  export type LibraryManagedAttributes<_C, P> = {
    [K in keyof P]: MaybeReactive<P[K]>;
  };

  /**
   * Атрибуты выводятся из `lib.dom` (см. `runtime/jsx-attributes`): имена и
   * события совпадают с тем, что разбирает рантайм.
   */
  export type IntrinsicElements = IntrinsicElementsMap;
}
