import type { Computed } from "../computed/index.js";
import type { State } from "../state/index.js";

export type Reactive<T = any> = State<T> | Computed<T>;

/**
 * Что можно положить в `deps`: `State`/`Computed`, объект от `reactive()`
 * (подписка на всё содержимое) или геттер — если из реактивного объекта нужна
 * только часть: `() => store.user.name`.
 */
export type DepSource = Reactive | (() => unknown) | object;

/** Ключ по умолчанию: у State/Computed одно значение. */
export const VALUE_KEY = "$_val";