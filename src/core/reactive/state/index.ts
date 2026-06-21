import { getType } from "../../utlils";
import { core, effect } from "../core";
import { StateOptions } from "./types";

export class State<T> {
  private _value: T;
  private options: StateOptions = {};

  constructor(value: T, options?: StateOptions) {
    this.options = options ?? {};

    this._value = value;
  }

  get value() {
    if (effect) {
      core.track(this, "$_val", effect);
    }
    return this._value;
  }
  set(newValue: unknown) {
    const oldType = getType(this._value);
    const newType = getType(this._value);

    let needUpdate = false;

    if (oldType === "object" && newType === "object") {
      needUpdate = !Object.is(this._value, newValue);
    } else {
      needUpdate = true;
    }

    if (needUpdate) {
      this._value = newValue as T;
      core.trigger(this, "$_val");
    }
  }
}

export function state<T>(initValue: T, options?: StateOptions) {
  return new State<T>(initValue, options);
}
