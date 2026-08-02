import { Effect, untrack } from "../core";
import { Reactive } from "../core/types";
import { CallbackWatch, OptionsWatch } from "./types";

class Watch {
  private effect: Effect<unknown[]>;
  private lastValue: unknown[];

  constructor(
    private callBack: CallbackWatch,
    private deps: Reactive[],
    options?: OptionsWatch,
  ) {
    // первичное чтение — вне трекинга, иначе watch внутри рендера
    // подпишет на свои источники ещё и рендер-эффект
    this.lastValue = untrack(() => this.read());

    this.effect = new Effect(() => this.read(), {
      job: () => this.run(),
    });
    this.effect.run();

    if (options?.immediate) {
      this.callBack(this.returnValue(this.lastValue), undefined);
    }
  }

  private read() {
    return this.deps.map((dep) => dep.value);
  }

  private returnValue(state: unknown[]) {
    return state.length > 1 ? state : state[0];
  }

  private run() {
    const oldValue = this.lastValue;
    // прогон через effect — заодно перезаписывает зависимости
    const newValue = this.effect.run();
    this.lastValue = newValue;

    this.callBack(
      this.returnValue(newValue),
      oldValue.length > 0 ? this.returnValue(oldValue) : undefined,
    );
  }

  /** Отписаться навсегда. */
  un() {
    this.effect.stop();
  }

  /** Приостановить: изменения, пришедшие во время паузы, догонят одним вызовом после `resume()`. */
  pause() {
    this.effect.pause();
  }

  resume() {
    this.effect.resume();
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
