import type { ComponentFn, Key, MaybeReactive, VNode } from "./runtime/types";

export { Fragment, jsx, jsxDEV, jsxs } from "./runtime/jsx";

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

  // TODO: расписать теги поимённо; пока атрибуты не типизируются
  export interface IntrinsicElements {
    [tag: string]: any;
  }
}
