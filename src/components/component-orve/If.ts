import { defineOptions } from "../..";
import { resolve } from "../../runtime/jsx";
import { Child, MaybeReactive } from "../../runtime/types";

export type IfProps = {
  /** Значение, сигнал или тонк — разворачиваются все три варианта. */
  when: MaybeReactive<unknown> | (() => unknown);
  then: () => Child;
  else?: () => Child;
};

/**
 * Условный участок дерева для сингл-режима: там render не перевызывается,
 * поэтому обычный `{cond.value && <b/>}` застынет на первом значении.
 *
 * Возвращает тонк — он становится реактивным слотом, и при смене условия
 * пересобирается только это поддерево.
 */
export const If = (props: IfProps) => {
  defineOptions({
    single: true,
  });

  return () => () => {
    if (resolve(props.when)) {
      return props.then?.();
    }
    return props.else ? props.else() : null;
  };
};
