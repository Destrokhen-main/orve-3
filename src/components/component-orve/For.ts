import { defineOptions } from "../..";
import { resolve } from "../../runtime/jsx";
import { Child, MaybeReactive } from "../../runtime/types";

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
  defineOptions({
    single: true,
  });

  return () => () => {
    const list = resolve<T[]>(props.each) ?? [];
    return list.map((item, index) => props.children(item, index));
  };
};
