import { toRaw } from "./shared.js";

/**
 * Обойти значение вглубь, коснувшись каждого свойства. Сам по себе обход
 * ничего не делает — работает побочный эффект чтения: если по пути встретился
 * прокси от `reactive()`, его трапы подпишут активный эффект.
 *
 * Нужен там, где источник задан целиком объектом, а не отдельным значением:
 * `computed(fn, { deps: [store] })` должен реагировать на любое изменение
 * внутри `store`.
 *
 * `WeakMap`/`WeakSet` не перебираются — на них подписаться нельзя.
 */
export function traverse(value: unknown, seen: Set<object> = new Set()): void {
  if (typeof value !== "object" || value === null) {
    return;
  }

  // ключуем по сырому объекту: в графе могут встретиться и прокси, и оригинал
  const raw = toRaw(value) as object;
  if (seen.has(raw)) {
    return;
  }
  seen.add(raw);

  if (Array.isArray(value)) {
    // читаем через прокси — так трекается и length, и каждый индекс
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
    return;
  }

  if (value instanceof WeakMap || value instanceof WeakSet) {
    return;
  }

  if (value instanceof Map) {
    value.forEach((item, key) => {
      traverse(key, seen);
      traverse(item, seen);
    });
    return;
  }

  if (value instanceof Set) {
    value.forEach((item) => traverse(item, seen));
    return;
  }

  for (const key of Object.keys(value)) {
    traverse((value as Record<string, unknown>)[key], seen);
  }
}
