import { Effect, EffectOptions } from "./effect.js";
import { Job, scheduler } from "./scheduler.js";
import { getActiveEffect } from "./stack.js";
import { VALUE_KEY } from "./types.js";

/** Эффекты, созданные через устаревший `setEffectOnces` — чтобы их можно было остановить по ссылке на fn. */
const legacyEffects = new WeakMap<() => void, Effect<unknown>>();

class Core {
  private targetMap = new WeakMap<object, Map<string, Set<Effect<any>>>>();

  /** Подписать активный эффект на `target[key]`. Повторный вызов ничего не дублирует. */
  track(target: object, key: string = VALUE_KEY) {
    const effect = getActiveEffect();
    if (!effect || !effect.active) {
      return;
    }

    let map = this.targetMap.get(target);
    if (!map) {
      map = new Map();
      this.targetMap.set(target, map);
    }

    let dep = map.get(key);
    if (!dep) {
      dep = new Set();
      map.set(key, dep);
    }

    if (!dep.has(effect)) {
      dep.add(effect);
      // обратная ссылка — чтобы эффект умел точечно отписаться сам
      effect.deps.push(dep);
    }
  }

  trigger(target: object, key: string = VALUE_KEY) {
    const dep = this.targetMap.get(target)?.get(key);
    if (!dep || dep.size === 0) {
      return;
    }

    // копия: notify может перестроить набор подписчиков
    [...dep].forEach((effect) => effect.notify());
  }

  add(job: Job) {
    scheduler.add(job);
  }

  cancel(job: Job) {
    scheduler.cancel(job);
  }
}

export const core = new Core();

/**
 * Реактивный эффект: выполняется сразу и перезапускается при изменении
 * прочитанных зависимостей, с полным пере-трекингом на каждом прогоне.
 */
export function effect(fn: () => void, options?: EffectOptions) {
  const _effect = new Effect(fn, options);
  _effect.run();
  return _effect;
}

export { cleanup, Effect } from "./effect.js";
export type { EffectOptions } from "./effect.js";
export { flushSync, nextTick } from "./scheduler.js";
export type { Job } from "./scheduler.js";
export {
  EffectScope,
  effectScope,
  getCurrentScope,
  getCurrentScopeHost,
  onScopeDispose,
  runWithScopeHost,
} from "./scope.js";
export type { ScopeHost, Stoppable } from "./scope.js";
export { getActiveEffect, untrack } from "./stack.js";
export { VALUE_KEY } from "./types.js";
export type { Reactive } from "./types.js";
