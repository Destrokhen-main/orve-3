import { Computed } from "../core/reactive/computed/index.js";
import { State } from "../core/reactive/state/index.js";
import { Child, FRAGMENT, Key, Props, Slot, VNode } from "./types.js";

export const Fragment = FRAGMENT;

/**
 * Фабрика автоматического JSX-рантайма. Ничего не вычисляет и не трогает DOM —
 * просто описывает узел. Значения слотов остаются как есть: примитив, сигнал
 * или тонк — разбирается на этапе монтирования.
 */
export function jsx(
  type: VNode["type"],
  props: Props | null,
  key?: Key,
): VNode {
  return {
    __orve: true,
    type,
    props: props ?? {},
    key: key ?? null,
  };
}

/** Вариант для нескольких статических детей — поведение то же. */
export const jsxs = jsx;
export const jsxDEV = jsx;

export function isVNode(value: unknown): value is VNode {
  return typeof value === "object" && value !== null && "__orve" in value;
}

export function isSignal(value: unknown): value is State<any> | Computed<any> {
  return value instanceof State || value instanceof Computed;
}

/** Реактивный слот — сигнал или тонк. */
export function isSlot(value: unknown): value is Slot {
  return isSignal(value) || typeof value === "function";
}

/** Прочитать слот (внутри эффекта — с подпиской). */
export function readSlot(source: Slot): Child {
  return isSignal(source) ? source.value : source();
}

/**
 * Развернуть проп, который разрешено передавать тонком.
 * Сигналы разворачивает `ReactiveProps`, здесь остаются только функции —
 * поэтому применять точечно, там где компонент это объявил (`Show.when`,
 * `For.each`), иначе пострадают пропы-колбэки.
 */
export function resolve<T>(value: unknown): T {
  return typeof value === "function" ? (value as () => T)() : (value as T);
}

export function isPrimitiveChild(
  value: Child,
): value is string | number | boolean | null | undefined {
  const type = typeof value;
  return (
    value === null ||
    value === undefined ||
    type === "string" ||
    type === "number" ||
    type === "boolean"
  );
}

/** `null` / `undefined` / `boolean` рисуются как пустой текст — их место в DOM сохраняется. */
export function toText(value: unknown): string {
  if (value === null || value === undefined || typeof value === "boolean") {
    return "";
  }
  return String(value);
}

/** Дети в props всегда приводятся к плоскому массиву. */
export function normalizeChildren(children: unknown): Child[] {
  if (children === undefined) {
    return [];
  }
  return Array.isArray(children) ? (children as Child[]) : [children as Child];
}

/** Массив или Fragment — то, что FragmentView умеет обновлять на месте. */
export function toChildArray(value: Child): Child[] | null {
  if (Array.isArray(value)) {
    return value;
  }
  if (isVNode(value) && value.type === FRAGMENT) {
    return normalizeChildren(value.props.children);
  }
  return null;
}
