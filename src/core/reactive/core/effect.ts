import { Job, scheduler } from "./scheduler.js";
import { getCurrentScope, Stoppable } from "./scope.js";
import { popEffect, pushEffect } from "./stack.js";

export type EffectOptions = {
  /**
   * Синхронная реакция на изменение зависимости. Если задан — эффект
   * не попадает в очередь (нужно для computed: он лишь помечается грязным).
   */
  scheduler?: () => void;
  /** Что выполнять из очереди. По умолчанию — сам эффект. */
  job?: () => void;
  onStop?: () => void;
};

export class Effect<T = unknown> implements Stoppable {
  /** Наборы подписчиков, в которых состоит этот эффект — для точечной отписки. */
  readonly deps: Array<Set<Effect<any>>> = [];

  private _active = true;
  private _paused = false;
  private _missed = false;
  private _running = false;

  /** Стабильная ссылка: очередь дедуплицирует задачи по идентичности. */
  readonly job: Job;

  constructor(
    private _fn: () => T,
    private options: EffectOptions = {},
  ) {
    this.job = () => {
      if (this.options.job) {
        this.options.job();
      } else {
        this.run();
      }
    };

    getCurrentScope()?.add(this);
  }

  get fn() {
    return this._fn;
  }

  get active() {
    return this._active;
  }

  get paused() {
    return this._paused;
  }

  set isActive(value: boolean) {
    if (value) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /** Выполнить, перезаписав набор зависимостей (ветвления учитываются). */
  run(): T {
    if (!this._active || this._running) {
      return this._fn();
    }

    cleanup(this);
    pushEffect(this);
    this._running = true;
    try {
      return this._fn();
    } finally {
      this._running = false;
      popEffect();
    }
  }

  /** Вызывается ядром при изменении зависимости. */
  notify() {
    if (!this._active || this._running) {
      return;
    }

    if (this._paused) {
      this._missed = true;
      return;
    }

    if (this.options.scheduler) {
      this.options.scheduler();
      return;
    }

    scheduler.add(this.job);
  }

  pause() {
    this._paused = true;
  }

  /** Пропущенные во время паузы обновления не теряются — догоняем одним вызовом. */
  resume() {
    if (!this._paused) {
      return;
    }
    this._paused = false;

    if (this._missed) {
      this._missed = false;
      this.notify();
    }
  }

  stop() {
    if (!this._active) {
      return;
    }

    cleanup(this);
    scheduler.cancel(this.job);
    this._active = false;
    this.options.onStop?.();
  }
}

/** Убрать эффект из всех наборов подписчиков, не задевая соседей. */
export function cleanup(effect: Effect<any>) {
  const { deps } = effect;

  for (const dep of deps) {
    dep.delete(effect);
  }
  deps.length = 0;
}
