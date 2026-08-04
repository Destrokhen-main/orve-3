import { core } from "../core/index.js";
import { StateOptions } from "./types.js";

export class State<T> {
  private _value: T;
  private options: StateOptions<T>;

  constructor(value: T, options?: StateOptions<T>) {
    this.options = options ?? {};
    this._value = value;
  }

  get value(): T {
    core.track(this);
    return this._value;
  }

  set value(newValue: T) {
    this.set(newValue);
  }

  /** Прочитать без подписки текущего эффекта. */
  peek(): T {
    return this._value;
  }

  /**
   * Новое значение либо функция-апдейтер от текущего.
   *
   * `T` не ограничен, поэтому сам может быть функцией — различить их
   * невозможно, и функция всегда трактуется как апдейтер. Чтобы положить
   * в состояние саму функцию, верни её из апдейтера: `set(() => fn)`.
   */
  set(newValue: T | ((current: T) => T)) {
    const val =
      typeof newValue === "function"
        ? (newValue as (current: T) => T)(this._value)
        : newValue;

    if (!this.hasChanged(val)) {
      return;
    }

    this._value = val;
    core.trigger(this);
  }

  private hasChanged(newValue: T) {
    const { equals } = this.options;

    if (equals === false) {
      return true;
    }

    if (typeof equals === "function") {
      return !equals(this._value, newValue);
    }

    return !Object.is(this._value, newValue);
  }
}

export function state<T>(initValue: T, options?: StateOptions<T>) {
  return new State<T>(initValue, options);
}
