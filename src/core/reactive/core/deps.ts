import { isReactive } from "../reactive/shared.js";
import { traverse } from "../reactive/traverse.js";
import type { DepSource } from "./types.js";

/**
 * Прочитать один источник из списка `deps` так, чтобы активный эффект на него
 * подписался. Форма источника определяется на месте:
 *
 * - `State`/`Computed` — читается `.value`;
 * - объект от `reactive()` — обходится вглубь, подписка на всё содержимое;
 * - геттер `() => …` — вызывается, подписка на всё, что он прочитал (точечный
 *   вариант для реактивного объекта: `() => store.user.name`);
 * - обычный объект — обходится вглубь на случай реактивных веток внутри.
 */
export function readDep(dep: DepSource): void {
  if (typeof dep === "function") {
    (dep as () => unknown)();
    return;
  }

  if (dep === null || typeof dep !== "object") {
    return;
  }

  // сначала прокси: у реактивного объекта тоже может быть ключ `value`
  if (isReactive(dep)) {
    traverse(dep);
    return;
  }

  if ("value" in dep) {
    void (dep as { value: unknown }).value;
    return;
  }

  traverse(dep);
}
