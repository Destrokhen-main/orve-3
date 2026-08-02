export type {
  Child,
  ComponentFn,
  MaybeReactive,
  Props,
  Render,
  VNode,
} from "../runtime/types";

import type { ComponentFn, Props } from "../runtime/types";

/** @deprecated используйте `ComponentFn` */
export type Fn<T extends Props = Props> = ComponentFn<T>;
