import { core } from "../core";
import { Effect } from "../core/effect";
import { Reactive } from "../core/types";
import { CallbackWatch, OptionsWatch } from "./types";

class Watch {
  private _effect: (() => void) | null = null;
  private lastValue: unknown[] = [];
  private sub: Effect[] = [];

  constructor(
    private callBack: CallbackWatch,
    private deps: Reactive[],
    private options?: OptionsWatch,
  ) {
    this.connect();
  }

  private returnValue(state: unknown[]) {
    return state.length > 1 ? state : state[0];
  }

  private connect() {
    const states: unknown[] = [];
    this.deps.forEach((dep) => {
      states.push(dep.value);
    });
    this.lastValue = states;

    if (this.options?.immediate) {
      this.callBack(this.returnValue(states), undefined);
    }

    this._effect = this.recalculate.bind(this);
    this.sub = this.deps.map((dep) => {
      return core.track(dep, "$_val", this._effect!);
    });
  }

  private recalculate() {
    const lastValue = this.lastValue;
    const states: unknown[] = [];
    this.deps.forEach((dep) => {
      states.push(dep.value);
    });

    this.callBack(
      this.returnValue(states),
      lastValue.length > 0 ? this.returnValue(lastValue) : undefined,
    );
    this.lastValue = states;
  }

  un() {
    if (this._effect) {
      core.deleteByEffect(this._effect);
      this.sub = [];
    }
  }

  pause() {
    if (this.sub.length > 0) {
      this.sub.forEach((sub) => {
        sub.isActive = false;
      });
    }
  }

  resume() {
    if (this.sub.length > 0) {
      this.sub.forEach((sub) => {
        sub.isActive = true;
      });
    }
  }
}

export function watch(
  fn: CallbackWatch,
  deps: Reactive | Reactive[],
  options?: OptionsWatch,
) {
  const _deps = Array.isArray(deps) ? deps : [deps];
  return new Watch(fn, _deps, options);
}
