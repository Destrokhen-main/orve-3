import { core } from "../core/index.js";
import { reactive } from "./index.js";
import { hasOwn, ITERATE_KEY, observable, RAW, toRaw } from "./shared.js";

/**
 * `Map`/`Set` работают через внутренние слоты, поэтому обычные `get`/`set`-трапы
 * их не ловят: методы нужно подменять целиком и звать на сыром объекте.
 */

type AnyMap = Map<unknown, unknown> & WeakMap<object, unknown>;
type AnySet = Set<unknown> & WeakSet<object>;
type Collection = AnyMap | AnySet;

function wrap(value: unknown) {
  return observable(value) ? reactive(value) : value;
}

/**
 * Ключи нормализуем к сырым: иначе `map.get(obj)` промахивался бы мимо
 * значения, положенного по реактивной обёртке того же объекта.
 */
function rawKey(key: unknown) {
  return toRaw(key);
}

function createIterator(
  method: "keys" | "values" | "entries" | typeof Symbol.iterator,
) {
  return function (this: Collection) {
    const target = toRaw(this) as unknown as Map<unknown, unknown>;
    core.track(target, ITERATE_KEY);

    const inner = (target[method as "entries"] as () => Iterator<unknown>)();
    const pairs =
      method === "entries" ||
      (method === Symbol.iterator && target instanceof Map);

    return {
      next() {
        const step = inner.next();
        if (step.done) {
          return step;
        }

        const value = pairs
          ? [wrap((step.value as unknown[])[0]), wrap((step.value as unknown[])[1])]
          : wrap(step.value);

        return { value, done: false };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  };
}

const instrumentations: Record<PropertyKey, unknown> = {
  get size() {
    const target = toRaw(this as unknown as Collection) as Map<unknown, unknown>;
    core.track(target, ITERATE_KEY);
    return target.size;
  },

  get(this: Collection, key: unknown) {
    const target = toRaw(this) as AnyMap;
    const normalized = rawKey(key);
    core.track(target, normalized);
    return wrap(target.get(normalized as object));
  },

  has(this: Collection, key: unknown) {
    const target = toRaw(this);
    const normalized = rawKey(key);
    core.track(target, normalized);
    return (target as AnyMap).has(normalized as object);
  },

  set(this: Collection, key: unknown, value: unknown) {
    const target = toRaw(this) as AnyMap;
    const normalized = rawKey(key);
    const newValue = toRaw(value);

    const hadKey = target.has(normalized as object);
    const oldValue = hadKey ? target.get(normalized as object) : undefined;

    target.set(normalized as object, newValue);

    if (!hadKey || !Object.is(oldValue, newValue)) {
      core.trigger(target, normalized);
      // перебор Map отдаёт значения, поэтому новое значение его тоже касается
      core.trigger(target, ITERATE_KEY);
    }

    return this;
  },

  add(this: Collection, value: unknown) {
    const target = toRaw(this) as AnySet;
    const normalized = rawKey(value);

    if (!target.has(normalized as object)) {
      target.add(normalized as object);
      core.trigger(target, normalized);
      core.trigger(target, ITERATE_KEY);
    }

    return this;
  },

  delete(this: Collection, key: unknown) {
    const target = toRaw(this) as AnyMap;
    const normalized = rawKey(key);

    if (!target.has(normalized as object)) {
      return false;
    }

    target.delete(normalized as object);
    core.trigger(target, normalized);
    core.trigger(target, ITERATE_KEY);

    return true;
  },

  clear(this: Collection) {
    const target = toRaw(this) as unknown as Map<unknown, unknown>;
    if (target.size === 0) {
      return;
    }

    const keys = [...target.keys()];
    target.clear();

    keys.forEach((key) => core.trigger(target, key));
    core.trigger(target, ITERATE_KEY);
  },

  forEach(
    this: Collection,
    callback: (value: unknown, key: unknown, collection: unknown) => void,
    thisArg?: unknown,
  ) {
    const target = toRaw(this) as unknown as Map<unknown, unknown>;
    core.track(target, ITERATE_KEY);

    target.forEach((value, key) => {
      callback.call(thisArg, wrap(value), wrap(key), this);
    });
  },

  keys: createIterator("keys"),
  values: createIterator("values"),
  entries: createIterator("entries"),
  [Symbol.iterator]: createIterator(Symbol.iterator),
};

export const collectionHandlers: ProxyHandler<object> = {
  get(target, key, receiver) {
    if (key === RAW) {
      return target;
    }

    // `key in target` отсекает лишнее у WeakMap/WeakSet: у них нет size и итерации
    const source =
      hasOwn(instrumentations, key) && key in target ? instrumentations : target;

    return Reflect.get(source, key, receiver);
  },
};
