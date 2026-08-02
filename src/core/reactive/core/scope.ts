export interface Stoppable {
  stop(): void;
}

let activeScope: EffectScope | null = null;

/**
 * Область владения эффектами. Всё реактивное, созданное внутри `run`,
 * автоматически регистрируется в области и умирает вместе с ней —
 * это точка интеграции с монтированием/размонтированием компонентов.
 */
export class EffectScope implements Stoppable {
  private _active = true;
  private items: Stoppable[] = [];
  private cleanups: Array<() => void> = [];

  constructor(detached = false) {
    if (!detached) {
      activeScope?.add(this);
    }
  }

  get active() {
    return this._active;
  }

  add(item: Stoppable) {
    if (this._active) {
      this.items.push(item);
    } else {
      item.stop();
    }
  }

  addCleanup(fn: () => void) {
    if (this._active) {
      this.cleanups.push(fn);
    } else {
      fn();
    }
  }

  run<T>(fn: () => T): T | undefined {
    if (!this._active) {
      return undefined;
    }

    const prev = activeScope;
    activeScope = this;
    try {
      return fn();
    } finally {
      activeScope = prev;
    }
  }

  stop() {
    if (!this._active) {
      return;
    }
    this._active = false;

    const items = this.items;
    const cleanups = this.cleanups;
    this.items = [];
    this.cleanups = [];

    items.forEach((item) => item.stop());
    cleanups.forEach((fn) => fn());
  }
}

/** @param detached не привязывать к родительской области */
export function effectScope(detached = false) {
  return new EffectScope(detached);
}

export function getCurrentScope() {
  return activeScope;
}

/** Зарегистрировать колбэк, который вызовется при остановке текущей области. */
export function onScopeDispose(fn: () => void) {
  activeScope?.addCleanup(fn);
}
