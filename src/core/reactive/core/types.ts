import type { Computed } from "../computed/index.js";
import type { State } from "../state/index.js";

export type Reactive<T = any> = State<T> | Computed<T>;

/** Ключ по умолчанию: у State/Computed одно значение. */
export const VALUE_KEY = "$_val";