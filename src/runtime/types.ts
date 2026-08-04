import type { Computed } from "../core/reactive/computed/index.js";
import type { State } from "../core/reactive/state/index.js";

export const FRAGMENT = Symbol("orve.fragment");

export type Key = string | number | null;
export type Props = Record<string, any>;

/** Функция, которую компонент возвращает из setup. */
export type Render = () => Child;

/** Компонент: setup вызывается один раз и возвращает render. */
export type ComponentFn<P extends Props = any> = (props: P) => Render;

export type VNode = {
  readonly __orve: true;
  readonly type: string | ComponentFn | typeof FRAGMENT;
  readonly props: Props;
  readonly key: Key;
};

/** Реактивный слот: сам сигнал или тонк. Разворачивается в DynamicView. */
export type Slot = State<any> | Computed<any> | (() => Child);

export type Child =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | Slot
  | Child[];

/** Проп компонента, который можно передать как значение или как сигнал. */
export type MaybeReactive<T> = T | State<T> | Computed<T>;

export interface View {
  /** Ключ из JSX — по нему diff сопоставляет узлы между прогонами. */
  readonly key: Key;
  mount(parent: Node, anchor: Node | null): void;
  /** Попытаться обновиться на месте. `false` — узел несовместим, нужна замена. */
  update(next: Child): boolean;
  unmount(): void;
  /** Все DOM-узлы верхнего уровня по порядку — нужно для перемещений. */
  nodes(): Node[];
  first(): Node | null;
}
