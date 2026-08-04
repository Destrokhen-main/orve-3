import { Computed, State, state } from "../../core/reactive/index.js";
import { isSignal } from "../../runtime/jsx.js";
import { Props } from "../../runtime/types.js";

/**
 * Пропсы компонента — объект с геттерами поверх реактивных ячеек.
 * Это то, что склеивает режимы: базовый родитель при обновлении пишет
 * в ячейку, а не пересоздаёт ребёнка, поэтому сингл-ребёнок видит
 * свежее значение, ни разу не перевызвав свой render.
 *
 * Сигнал, переданный пропом (`items={items}`), разворачивается —
 * ребёнок читает `props.items` как обычное значение.
 */
export class ReactiveProps {
  private cells = new Map<string, State<unknown>>();
  private signals = new Map<string, State<any> | Computed<any>>();
  readonly proxy: Props = {};

  constructor(raw: Props) {
    this.patch(raw);
  }

  patch(raw: Props) {
    for (const key of Object.keys(raw)) {
      const value = raw[key];

      if (isSignal(value)) {
        if (this.signals.get(key) !== value) {
          this.signals.set(key, value);
          this.cells.delete(key);
          this.define(key);
        }
        continue;
      }

      const cell = this.cells.get(key);
      if (cell && !this.signals.has(key)) {
        // через апдейтер: проп может быть функцией (компонент, колбэк),
        // а `set` трактует переданную функцию как апдейтер
        cell.set(() => value);
        continue;
      }

      this.signals.delete(key);
      this.cells.set(key, state(value));
      this.define(key);
    }

    // пропы, которых больше нет
    for (const key of this.cells.keys()) {
      if (!(key in raw)) {
        this.cells.get(key)!.set(() => undefined);
      }
    }
  }

  private define(key: string) {
    if (Object.prototype.hasOwnProperty.call(this.proxy, key)) {
      return;
    }

    Object.defineProperty(this.proxy, key, {
      configurable: true,
      enumerable: true,
      get: () => {
        const signal = this.signals.get(key);
        return signal ? signal.value : this.cells.get(key)?.value;
      },
    });
  }
}
