import { core } from "../core";
import { StateOptions } from "./types";

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

  set(newValue: T) {
    if (!this.hasChanged(newValue)) {
      return;
    }

    this._value = newValue;
    core.trigger(this);
  }

  /** Обновить на основе текущего значения, не подписываясь на него. */
  update(fn: (current: T) => T) {
    this.set(fn(this._value));
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
