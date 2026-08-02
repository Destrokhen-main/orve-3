import type { Effect } from "./effect";

/**
 * Стек активных эффектов. Именно стек, а не одна ячейка: рендер компонента
 * может внутри себя читать computed или рендерить вложенный компонент,
 * и после возврата трекинг внешнего эффекта обязан восстановиться.
 */
const stack: Array<Effect<any> | null> = [];

export function getActiveEffect(): Effect<any> | null {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

export function pushEffect(effect: Effect<any> | null) {
  stack.push(effect);
}

export function popEffect() {
  stack.pop();
}

/** Прочитать реактивные значения, не подписывая на них текущий эффект. */
export function untrack<T>(fn: () => T): T {
  pushEffect(null);
  try {
    return fn();
  } finally {
    popEffect();
  }
}
