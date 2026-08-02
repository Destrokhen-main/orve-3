import type { Computed } from "../computed";
import type { State } from "../state";

export type Reactive<T = any> = State<T> | Computed<T>;

/** Ключ по умолчанию: у State/Computed одно значение. */
export const VALUE_KEY = "$_val";