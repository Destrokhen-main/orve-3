import { Effect } from "./effect";
import { Reactive } from "./types";

export let effect : (() => void) | null = null;
export function setEffectOnces(fn: () => void) {
  effect = fn;
  fn();
  effect = null;
}

class Core {
  private quee: Set<() => void> = new Set();
  private stateMap = new WeakMap<Reactive, Map<string, Set<Effect>>>();
  private subscribersEffect = new WeakMap<() => void, Map<string, Set<Reactive>>>();
  private pending = false;

  add(fn: () => void) {
    this.quee.add(fn);

    if (!this.pending) {
      this.proccessWorker();
    }
  }

  private proccessWorker() {
    if (!this.pending) {
      this.pending = true;
      queueMicrotask(() => {
        this.pending = false;
        this.quee.forEach(f => f());
        this.quee = new Set();
      })
    }
  }

  cancelTask(fn: () => void) {
    this.quee.delete(fn);
  }

  deleteState(target: Reactive, key: string, fn: () => void) {
    const map = this.stateMap.get(target);
    if (!map) {
      return;
    }
    
    if (map.has(key)) {
      map.delete(key);
    }
  }

  deleteByEffect(fn: () => void) {
    const reactives = this.subscribersEffect.get(fn);

    if (!reactives) {
      return;
    }

    for (const [key, value] of reactives.entries()) {
      value.forEach((r) => {
        this.deleteState(r, key, fn);
      })
    }
    this.subscribersEffect.delete(fn);
  }

  track(target: Reactive, key: string, fn: () => void) {
    let map = this.stateMap.get(target);

    if (!map) {
      map = new Map();
      this.stateMap.set(target, map);
    }

    let keySet = map.get(key);

    if (!keySet) {
      keySet = new Set();
      map.set(key, keySet);
    }

    const effect = new Effect(fn)
    keySet.add(effect);


    let setEffect = this.subscribersEffect.get(effect.fn);
    if (!setEffect) {
      setEffect = new Map();
      this.subscribersEffect.set(effect.fn, setEffect);
    }

    let set = setEffect.get(key);
    if (!set) {
      set = new Set();
      setEffect.set(key, set);
    }
     
    set.add(target);

    return effect;
  }

  trigger(target: Reactive, key: string) {
    const map = this.stateMap.get(target);
    if (!map) {
      return;
    }

    const set = map.get(key);
    if (!set) {
      return;
    }

    set.forEach(f => {
      if (f.isActive) {
        this.add(f.fn);
      }
    })
  } 
}

export async function nextTick(fn?: () => void) {
  if (fn) {
    await new Promise((r) => r(true));
    return fn();
  }

  return new Promise((r) => r(true));
}

export const core = new Core();