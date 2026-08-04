import { defineOptions } from "../../index.js";
import { getCurrentContext } from "../../instance/context/index.js";
import { resolve } from "../../runtime/jsx.js";
import { Child, MaybeReactive } from "../../runtime/types.js";

export type ForProps<T = any> = {
  /** Массив, сигнал или тонк — разворачиваются все три варианта. */
  each: MaybeReactive<T[]> | (() => T[]);
  children: (item: T, index: number) => Child;
};

/**
 * Список для сингл-режима. Возвращает тонк с массивом — дальше работает
 * тот же реконсилятор, что и в базовом режиме, поэтому строки с `key`
 * переиспользуются, а не пересоздаются.
 */
export const For = <T>(props: ForProps<T>) => {
  const ctx = getCurrentContext();

  if (!ctx?.parent?.options.single) {
    console.warn("[orve] - Использование For в base комопнентах.");
  }

  defineOptions({
    single: true,
  });

  return () => () => {
    const list = resolve<T[]>(props.each) ?? [];
    return list.map((item, index) => props.children(item, index));
  };
};
