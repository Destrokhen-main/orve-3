import { core, untrack } from "../core/index.js";
import { collectionHandlers } from "./collections.js";
import {
  hasOwn,
  isCollection,
  ITERATE_KEY,
  observable,
  proxyCache,
  RAW,
  toRaw,
  wellKnownSymbols,
} from "./shared.js";

export { isReactive, markRaw, toRaw, ITERATE_KEY } from "./shared.js";

/** Индекс массива: `arr[2]`, но не `arr.length` и не `arr.map`. */
function isIndexKey(key: PropertyKey) {
  return typeof key === "string" && `${Number.parseInt(key, 10)}` === key;
}

const arrayInstrumentations: Record<string, unknown> = {};

/**
 * Поиск идёт по сырым элементам, а наружу они выдавались обёрнутыми, поэтому
 * `arr.includes(item)` с уже прочитанным из состояния элементом промахивался бы.
 * Второй проход разворачивает аргументы.
 */
(["includes", "indexOf", "lastIndexOf"] as const).forEach((key) => {
  arrayInstrumentations[key] = function (this: unknown[], ...args: unknown[]) {
    const raw = toRaw(this);

    // результат зависит от каждого элемента — подписываемся на весь массив
    for (let i = 0; i < raw.length; i++) {
      core.track(raw, `${i}`);
    }

    // ищем в сыром массиве: элементы там сырые, а аргумент мог прийти обёрткой
    const method = raw[key] as (...a: unknown[]) => unknown;
    const result = method.apply(raw, args);

    return result === -1 || result === false
      ? method.apply(raw, args.map(toRaw))
      : result;
  };
});

/**
 * Мутирующие методы читают `length` по ходу дела. Без снятия трекинга эффект,
 * который делает `arr.push(...)`, подписался бы на длину, которую сам же меняет.
 * Мутации при этом идут через `this` (прокси), так что триггеры не теряются.
 */
(["push", "pop", "shift", "unshift", "splice"] as const).forEach((key) => {
  arrayInstrumentations[key] = function (this: unknown[], ...args: unknown[]) {
    const method = toRaw(this)[key] as (...a: unknown[]) => unknown;
    return untrack(() => method.apply(this, args));
  };
});

const baseHandlers: ProxyHandler<object> = {
  get(target, key, receiver) {
    if (key === RAW) {
      return target;
    }

    if (Array.isArray(target) && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }

    const result = Reflect.get(target, key, receiver);

    if (typeof key === "symbol" && wellKnownSymbols.has(key)) {
      return result;
    }

    core.track(target, key);

    return observable(result) ? reactive(result) : result;
  },

  set(target, key, value, receiver) {
    const oldValue = (target as Record<PropertyKey, unknown>)[key];
    const newValue = toRaw(value);

    const hadKey =
      Array.isArray(target) && isIndexKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);

    const result = Reflect.set(target, key, newValue, receiver);

    // сеттер, унаследованный от чужого прокси: тот сам отчитается о записи
    if (!result || target !== toRaw(receiver)) {
      return result;
    }

    if (!hadKey) {
      core.trigger(target, key);
      core.trigger(target, ITERATE_KEY);
      if (Array.isArray(target)) {
        core.trigger(target, "length");
      }
    } else if (!Object.is(oldValue, newValue)) {
      core.trigger(target, key);
      // обрезание длины удаляет элементы — разбудить тех, кто их читал
      if (Array.isArray(target) && key === "length") {
        for (let i = Number(newValue); i < Number(oldValue); i++) {
          core.trigger(target, `${i}`);
        }
        core.trigger(target, ITERATE_KEY);
      }
    }

    return result;
  },

  deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const result = Reflect.deleteProperty(target, key);

    if (result && hadKey) {
      core.trigger(target, key);
      core.trigger(target, ITERATE_KEY);
    }

    return result;
  },

  has(target, key) {
    if (typeof key !== "symbol" || !wellKnownSymbols.has(key)) {
      core.track(target, key);
    }
    return Reflect.has(target, key);
  },

  ownKeys(target) {
    core.track(target, Array.isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  },
};

/**
 * Глубоко реактивный объект: чтение свойства подписывает текущий эффект,
 * запись — будит подписчиков. Вложенные объекты оборачиваются лениво, на
 * первом чтении.
 *
 * ```ts
 * const store = reactive({ user: { name: "аня" } });
 * effect(() => console.log(store.user.name));
 * store.user.name = "оля";   // эффект перезапустится
 * ```
 *
 * Наружу утекает именно прокси — в сторонние библиотеки, ключи `Map`,
 * сравнения по ссылке отдавай `toRaw(value)`.
 *
 * Оборачиваются обычные объекты, массивы, `Map`/`Set`/`WeakMap`/`WeakSet`.
 * `Date`, `RegExp`, DOM-узлы, замороженные и помеченные `markRaw` объекты
 * возвращаются как есть. Приватные поля класса (`#x`) через прокси не читаются —
 * такие инстансы помечай `markRaw`.
 */
export function reactive<T extends object>(target: T): T {
  // уже прокси
  if (isProxy(target)) {
    return target;
  }

  if (!observable(target)) {
    return target;
  }

  const existing = proxyCache.get(target);
  if (existing) {
    return existing as T;
  }

  const proxy = new Proxy(
    target,
    isCollection(target) ? collectionHandlers : baseHandlers,
  );
  proxyCache.set(target, proxy);

  return proxy as T;
}

function isProxy(value: object) {
  return !!(value as { [RAW]?: unknown })[RAW];
}
