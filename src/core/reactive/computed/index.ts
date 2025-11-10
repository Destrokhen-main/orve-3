import { core, effect, setEffectOnces } from "../core";
import { ComputedOptions } from "./types";

export class Computed<T> {
  private init = false;
  private _value: T | undefined;
  private _effect: (() => void) | null = null;

  constructor(
    private callBack: () => T,
    private options?: ComputedOptions
  ) {}

  get() {
    if (effect) {
      core.track(this, '$_val', effect);
    }
    if (!this.init) {
      this.init = true;
      this.proccessEffect();
    }
    return this._value;
  }

  proccessEffect() {
    let isFisrtCalc = true;

    if (this._effect) {
      core.deleteByEffect(this._effect);
    }

    this._effect = () => {
      if (isFisrtCalc) {
        isFisrtCalc = false;
        this._value = this.callBack();
        core.trigger(this, '$_val');
      } else {
        this.proccessEffect();
      }
    }

    setEffectOnces(this._effect);
  }
}

export function computed<T>(fn : () => T, options?: ComputedOptions) {
  return new Computed(fn, options);
}