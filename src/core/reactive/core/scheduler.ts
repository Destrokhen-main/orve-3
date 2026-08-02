export type Job = () => void;

/** Защита от бесконечного цикла обновлений (эффект пишет в то, что читает). */
const MAX_FLUSH_PASSES = 1000;

class Scheduler {
  private queue: Set<Job> = new Set();
  private pending = false;
  private flushing = false;
  private resolvers: Array<() => void> = [];

  get isPending() {
    return this.pending || this.flushing;
  }

  add(job: Job) {
    this.queue.add(job);

    // Во время flush цикл сам дочитает очередь, новый микротаск не нужен.
    if (!this.pending && !this.flushing) {
      this.pending = true;
      queueMicrotask(() => this.flush());
    }
  }

  cancel(job: Job) {
    this.queue.delete(job);
  }

  /**
   * Очередь забирается целиком перед проходом, поэтому задачи, добавленные
   * во время выполнения, попадают в следующий проход, а не теряются
   * и не выполняются дважды.
   */
  flush() {
    if (this.flushing) {
      return;
    }

    this.pending = false;
    this.flushing = true;

    let passes = 0;
    try {
      while (this.queue.size > 0) {
        if (++passes > MAX_FLUSH_PASSES) {
          this.queue.clear();
          throw new Error(
            "[orve] Обнаружен бесконечный цикл обновлений: эффект изменяет состояние, от которого сам зависит.",
          );
        }

        const jobs = this.queue;
        this.queue = new Set();
        jobs.forEach((job) => job());
      }
    } finally {
      this.flushing = false;
      const resolvers = this.resolvers;
      this.resolvers = [];
      resolvers.forEach((resolve) => resolve());
    }
  }

  onFlushed(resolve: () => void) {
    this.resolvers.push(resolve);
  }
}

export const scheduler = new Scheduler();

/** Промис, который резолвится после того, как очередь эффектов полностью разобрана. */
export function nextTick(): Promise<void>;
export function nextTick<T>(fn: () => T): Promise<T>;
export function nextTick<T>(fn?: () => T): Promise<T | void> {
  const promise = scheduler.isPending
    ? new Promise<void>((resolve) => scheduler.onFlushed(resolve))
    : Promise.resolve();

  return fn ? promise.then(fn) : promise;
}

/** Синхронно выполнить всё, что накопилось в очереди. */
export function flushSync() {
  scheduler.flush();
}
