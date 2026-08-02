import { computed } from "../computed";
import {
  effect,
  effectScope,
  flushSync,
  nextTick,
  onScopeDispose,
  untrack,
} from "../core";
import { state } from "../state";
import { watch } from "../watch";

describe("core", () => {
  describe("стек эффектов", () => {
    it("вложенный эффект не ломает трекинг внешнего", async () => {
      const a = state(1);
      const b = state(1);

      const inner = jest.fn(() => {
        b.value;
      });
      const outer = jest.fn(() => {
        effect(inner);
        // читается ПОСЛЕ вложенного эффекта — раньше эта подписка терялась
        a.value;
      });

      effect(outer);
      expect(outer).toHaveBeenCalledTimes(1);

      a.set(2);
      await nextTick();
      expect(outer).toHaveBeenCalledTimes(2);
    });

    it("computed внутри эффекта не перехватывает подписку", async () => {
      const a = state(1);
      const b = state(1);
      const c = computed(() => a.value);

      const fn = jest.fn(() => {
        c.value;
        b.value;
      });

      effect(fn);

      b.set(2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("подписки", () => {
    it("несколько чтений одного состояния дают один вызов", async () => {
      const a = state(1);
      const fn = jest.fn(() => {
        a.value;
        a.value;
        a.value;
      });

      effect(fn);
      a.set(2);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("остановка одного эффекта не задевает остальных", async () => {
      const a = state(1);
      const first = jest.fn(() => {
        a.value;
      });
      const second = jest.fn(() => {
        a.value;
      });

      const e = effect(first);
      effect(second);

      e.stop();
      a.set(2);
      await nextTick();

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(2);
    });

    it("зависимости пересобираются на каждом прогоне", async () => {
      const flag = state(true);
      const a = state(1);
      const fn = jest.fn(() => {
        if (flag.value) {
          a.value;
        }
      });

      effect(fn);
      flag.set(false);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);

      // ветка с a больше не выполняется — подписки на a быть не должно
      a.set(2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("untrack не создаёт подписку", async () => {
      const a = state(1);
      const fn = jest.fn(() => {
        untrack(() => a.value);
      });

      effect(fn);
      a.set(2);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("state", () => {
    it("запись того же значения не триггерит", async () => {
      const a = state(1);
      const fn = jest.fn(() => {
        a.value;
      });

      effect(fn);
      a.set(1);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("equals: false триггерит на любую запись", async () => {
      const obj = { a: 1 };
      const a = state(obj, { equals: false });
      const fn = jest.fn(() => {
        a.value;
      });

      effect(fn);
      obj.a = 2;
      a.set(obj);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("peek читает без подписки", async () => {
      const a = state(1);
      const fn = jest.fn(() => {
        a.peek();
      });

      effect(fn);
      a.set(2);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("computed", () => {
    it("не пересчитывается, пока значение не читают", async () => {
      const a = state(1);
      const fn = jest.fn(() => a.value * 2);
      const c = computed(fn);

      expect(c.value).toBe(2);
      a.set(2);
      a.set(3);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(c.value).toBe(6);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("effectScope", () => {
    it("останавливает всё, что создано внутри", async () => {
      const a = state(1);
      const effectFn = jest.fn(() => {
        a.value;
      });
      const watchFn = jest.fn();
      const disposed = jest.fn();

      const scope = effectScope();
      scope.run(() => {
        effect(effectFn);
        watch(watchFn, a);
        onScopeDispose(disposed);
      });

      a.set(2);
      await nextTick();
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(watchFn).toHaveBeenCalledTimes(1);

      scope.stop();
      a.set(3);
      await nextTick();

      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(watchFn).toHaveBeenCalledTimes(1);
      expect(disposed).toHaveBeenCalledTimes(1);
    });

    it("вложенная область умирает вместе с родительской", async () => {
      const a = state(1);
      const fn = jest.fn(() => {
        a.value;
      });

      const parent = effectScope();
      parent.run(() => {
        const child = effectScope();
        child.run(() => effect(fn));
      });

      parent.stop();
      a.set(2);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("watch", () => {
    it("созданный внутри эффекта не подписывает его на свои источники", async () => {
      const a = state(1);
      const b = state(1);
      const render = jest.fn(() => {
        b.value;
        watch(() => {}, a);
      });

      effect(render);
      a.set(2);
      await nextTick();

      expect(render).toHaveBeenCalledTimes(1);
    });

    it("после resume догоняет пропущенное изменение", async () => {
      const a = state(1);
      const fn = jest.fn();
      const w = watch(fn, a);

      w.pause();
      a.set(2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(0);

      w.resume();
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(2, 1);
    });
  });

  describe("очередь", () => {
    it("изменения внутри эффекта попадают в тот же flush", async () => {
      const a = state(1);
      const b = state(0);
      const order: string[] = [];

      effect(() => {
        order.push(`a:${a.value}`);
        if (a.value === 2) {
          b.set(10);
        }
      });
      effect(() => {
        order.push(`b:${b.value}`);
      });

      a.set(2);
      await nextTick();

      expect(order).toStrictEqual(["a:1", "b:0", "a:2", "b:10"]);
    });

    it("эффект не перезапускает сам себя", async () => {
      const a = state(1);
      const fn = jest.fn(() => {
        a.set(a.value + 1);
      });

      effect(fn);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("ловит бесконечный цикл обновлений между эффектами", () => {
      const a = state(0);
      const b = state(0);

      effect(() => {
        b.set(a.value + 1);
      });
      effect(() => {
        a.set(b.value + 1);
      });

      a.set(100);
      expect(() => flushSync()).toThrow(/бесконечный цикл/);
    });
  });
});
