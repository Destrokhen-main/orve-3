import type { Reactive } from "../core/types";

export type ComputedOptions = {
  /**
   * Явный список зависимостей. Если задан — авто-трекинг внутри вычисления
   * отключается, computed пересчитывается только при изменении этих источников.
   */
  deps: Reactive[];
};
