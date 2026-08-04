export interface Stoppable {
  stop(): void;
}

/**
 * Владелец области эффектов. Может отдать её, создав только в этот момент —
 * так представление без единого эффекта (например, текстовый узел) вообще
 * не платит за `EffectScope`.
 */
export interface ScopeHost {
  resolveScope(): EffectScope;
}

let activeHost: ScopeHost | null = null;

/**
 * Область владения эффектами. Всё реактивное, созданное внутри `run`,
 * автоматически регистрируется в области и умирает вместе с ней —
 * это точка интеграции с монтированием/размонтированием компонентов.
 */
export class EffectScope implements Stoppable, ScopeHost {
  private _active = true;
  /** Списки создаются по факту: пустая область не держит ни одного массива. */
  private items: Stoppable[] | null = null;
  private cleanups: Array<() => void> | null = null;

  constructor(detached = false) {
    if (!detached) {
      getCurrentScope()?.add(this);
    }
  }

  get active() {
    return this._active;
  }

  resolveScope(): EffectScope {
    return this;
  }

  add(item: Stoppable) {
    if (!this._active) {
      item.stop();
      return;
    }
    (this.items ??= []).push(item);
  }

  addCleanup(fn: () => void) {
    if (!this._active) {
      fn();
      return;
    }
    (this.cleanups ??= []).push(fn);
  }

  run<T>(fn: () => T): T | undefined {
    if (!this._active) {
      return undefined;
    }

    return runWithScopeHost(this, fn);
  }

  stop() {
    if (!this._active) {
      return;
    }
    this._active = false;

    const items = this.items;
    const cleanups = this.cleanups;
    this.items = null;
    this.cleanups = null;

    items?.forEach((item) => item.stop());
    cleanups?.forEach((fn) => fn());
  }
}

/** @param detached не привязывать к родительской области */
export function effectScope(detached = false) {
  return new EffectScope(detached);
}

/**
 * Текущая область. Обращение материализует ленивых владельцев по цепочке:
 * спрашивают её только тогда, когда есть что в неё положить.
 */
export function getCurrentScope(): EffectScope | null {
  return activeHost ? activeHost.resolveScope() : null;
}

/** Текущий владелец — без материализации области. */
export function getCurrentScopeHost(): ScopeHost | null {
  return activeHost;
}

/** Выполнить `fn`, сделав `host` текущим владельцем области. */
export function runWithScopeHost<T>(host: ScopeHost | null, fn: () => T): T {
  const prev = activeHost;
  activeHost = host;
  try {
    return fn();
  } finally {
    activeHost = prev;
  }
}

/** Зарегистрировать колбэк, который вызовется при остановке текущей области. */
export function onScopeDispose(fn: () => void) {
  getCurrentScope()?.addCleanup(fn);
}
