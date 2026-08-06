import { core, Effect, readDep, untrack } from "../core/index.js";
import { ComputedOptions } from "./types.js";

export class Computed<T> {
  private _value!: T;
  private dirty = true;
  private effect: Effect<T>;

  constructor(callBack: () => T, options?: ComputedOptions) {
    const deps = options?.deps;

    const compute: () => T = deps
      ? () => {
          // читаем только объявленные зависимости, само вычисление — без трекинга
          deps.forEach((dep) => readDep(dep));
          return untrack(callBack);
        }
      : callBack;

    this.effect = new Effect(compute, {
      // изменение зависимости не пересчитывает значение, а только помечает его грязным
      scheduler: () => this.invalidate(),
    });
  }

  get value(): T {
    core.track(this);

    if (this.dirty) {
      this.dirty = false;
      this._value = this.effect.run();
    }

    return this._value;
  }

  /** Прочитать без подписки текущего эффекта. */
  peek(): T {
    return untrack(() => this.value);
  }

  /** Отписаться от всех зависимостей. */
  stop() {
    this.effect.stop();
  }

  private invalidate() {
    if (this.dirty) {
      return;
    }

    this.dirty = true;
    core.trigger(this);
  }
}

export function computed<T>(fn: () => T, options?: ComputedOptions) {
  return new Computed(fn, options);
}
