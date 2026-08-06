/**
 * Ключ-заглушка для операций, зависящих от состава коллекции, а не от
 * конкретного ключа: `for...in`, `Object.keys`, `Map#size`, итерация.
 */
export const ITERATE_KEY = Symbol("orve.iterate");

/** Скрытое свойство прокси: отдаёт исходный объект. */
export const RAW = Symbol("orve.raw");

/** Метка «не оборачивать» от `markRaw`. */
export const SKIP = Symbol("orve.skip");

/** raw -> proxy. Нужен, чтобы `reactive(x)` всегда давал ту же обёртку. */
export const proxyCache = new WeakMap<object, object>();

/** Symbol.iterator и прочие — читаются движком, подписка на них бессмысленна. */
export const wellKnownSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map((key) => (Symbol as unknown as Record<string, unknown>)[key])
    .filter((value): value is symbol => typeof value === "symbol"),
);

export function hasOwn(target: object, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(target, key);
}

/** Развернуть прокси до исходного объекта. Для не-прокси возвращает как есть. */
export function toRaw<T>(value: T): T {
  const raw = (value as { [RAW]?: T } | null | undefined)?.[RAW];
  return raw ? toRaw(raw) : value;
}

export function isReactive(value: unknown): boolean {
  return !!(value && (value as { [RAW]?: unknown })[RAW]);
}

/**
 * Пометить объект как нереактивный: `reactive()` вернёт его как есть и не
 * будет оборачивать даже вложенным. Нужно для инстансов сторонних классов,
 * которым прокси ломает работу.
 */
export function markRaw<T extends object>(value: T): T {
  Object.defineProperty(value, SKIP, {
    value: true,
    enumerable: false,
    configurable: true,
  });
  return value;
}

const COLLECTION_TAGS = new Set([
  "[object Map]",
  "[object Set]",
  "[object WeakMap]",
  "[object WeakSet]",
]);

export function isCollection(value: object) {
  return COLLECTION_TAGS.has(Object.prototype.toString.call(value));
}

/**
 * Стоит ли оборачивать значение. Обычные объекты, массивы и коллекции — да;
 * `Date`, `RegExp`, DOM-узлы, промисы и прочие экзотические объекты — нет:
 * их поведение завязано на внутренние слоты, прокси их ломает.
 *
 * Замороженные пропускаем из-за инварианта Proxy: вернуть обёртку для
 * non-configurable non-writable свойства — TypeError.
 */
export function observable(value: unknown): value is object {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if ((value as { [SKIP]?: boolean })[SKIP] || !Object.isExtensible(value)) {
    return false;
  }

  const tag = Object.prototype.toString.call(value);
  return tag === "[object Object]" || tag === "[object Array]" || COLLECTION_TAGS.has(tag);
}
