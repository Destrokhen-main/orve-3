import { effect, nextTick } from "../core/index.js";
import {
  isReactive,
  markRaw,
  reactive,
  toRaw,
} from "../reactive/index.js";

describe("reactive", () => {
  describe("объекты", () => {
    it("мутация поля будит эффект", async () => {
      const store = reactive({ a: 1 });
      const fn = jest.fn(() => {
        store.a;
      });

      effect(fn);
      store.a = 2;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("запись того же значения не будит", async () => {
      const store = reactive({ a: 1 });
      const fn = jest.fn(() => {
        store.a;
      });

      effect(fn);
      store.a = 1;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("непрочитанное поле не будит", async () => {
      const store = reactive({ a: 1, b: 1 });
      const fn = jest.fn(() => {
        store.a;
      });

      effect(fn);
      store.b = 2;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("вложенные объекты реактивны", async () => {
      const store = reactive({ nested: { deep: { value: 1 } } });
      const fn = jest.fn(() => {
        store.nested.deep.value;
      });

      effect(fn);
      store.nested.deep.value = 2;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("добавление и удаление ключа будят перебор", async () => {
      const store = reactive<Record<string, number>>({ a: 1 });
      const fn = jest.fn(() => {
        Object.keys(store);
      });

      effect(fn);
      store.b = 2;
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);

      delete store.b;
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("in отслеживается", async () => {
      const store = reactive<Record<string, number>>({});
      const fn = jest.fn(() => {
        "a" in store;
      });

      effect(fn);
      store.a = 1;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("объект, положенный после создания, тоже реактивен", async () => {
      const store = reactive<{ nested?: { a: number } }>({});
      store.nested = { a: 1 };

      const fn = jest.fn(() => {
        store.nested?.a;
      });

      effect(fn);
      store.nested!.a = 2;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("массивы", () => {
    it("push будит перебор", async () => {
      const list = reactive([1]);
      const fn = jest.fn(() => {
        list.forEach(() => {});
      });

      effect(fn);
      list.push(2);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("мутация по индексу будит", async () => {
      const list = reactive([1, 2]);
      const fn = jest.fn(() => {
        list[0];
      });

      effect(fn);
      list[0] = 9;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("обрезание длины будит читателя удалённого элемента", async () => {
      const list = reactive([1, 2, 3]);
      const fn = jest.fn(() => {
        list[2];
      });

      effect(fn);
      list.length = 1;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("push внутри эффекта не зацикливает его", async () => {
      const list = reactive<number[]>([]);
      const fn = jest.fn(() => {
        list.push(1);
      });

      effect(fn);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(list.length).toBe(1);
    });

    it("includes находит элемент, прочитанный из массива", () => {
      const item = { id: 1 };
      const list = reactive([item]);

      expect(list.includes(list[0])).toBe(true);
      expect(list.includes(item)).toBe(true);
      expect(list.indexOf(item)).toBe(0);
    });

    it("несколько мутаций подряд дают один прогон", async () => {
      const list = reactive([1]);
      const fn = jest.fn(() => {
        list.forEach(() => {});
      });

      effect(fn);
      list.push(2);
      list.push(3);
      list[0] = 0;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("Map и Set", () => {
    it("set будит читателя ключа", async () => {
      const map = reactive(new Map<string, number>([["a", 1]]));
      const fn = jest.fn(() => {
        map.get("a");
      });

      effect(fn);
      map.set("a", 2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);

      map.set("b", 1);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("size и итерация будятся на новый ключ", async () => {
      const map = reactive(new Map<string, number>());
      const size = jest.fn(() => {
        map.size;
      });
      const iterate = jest.fn(() => {
        [...map.keys()];
      });

      effect(size);
      effect(iterate);
      map.set("a", 1);
      await nextTick();

      expect(size).toHaveBeenCalledTimes(2);
      expect(iterate).toHaveBeenCalledTimes(2);
    });

    it("перебор будится и на смену значения по существующему ключу", async () => {
      const map = reactive(new Map([["a", 1]]));
      const fn = jest.fn(() => {
        [...map.values()];
      });

      effect(fn);
      map.set("a", 2);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("значения из Map реактивны", async () => {
      const map = reactive(new Map([["a", { count: 1 }]]));
      const fn = jest.fn(() => {
        map.get("a")!.count;
      });

      effect(fn);
      map.get("a")!.count = 2;
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("ключ-объект работает и в сыром, и в обёрнутом виде", () => {
      const key = { id: 1 };
      const map = reactive(new Map<object, number>());
      const wrapped = reactive(key);

      map.set(wrapped, 1);

      expect(map.get(key)).toBe(1);
      expect(map.has(wrapped)).toBe(true);
      expect(toRaw(map).get(key)).toBe(1);
    });

    it("Set: add и delete будят перебор", async () => {
      const set = reactive(new Set<number>([1]));
      const fn = jest.fn(() => {
        [...set];
      });

      effect(fn);
      set.add(2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);

      set.delete(2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(3);

      set.add(1);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("clear будит читателей существовавших ключей", async () => {
      const map = reactive(new Map([["a", 1]]));
      const fn = jest.fn(() => {
        map.get("a");
      });

      effect(fn);
      map.clear();
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("forEach отслеживается и отдаёт обёрнутые значения", async () => {
      const map = reactive(new Map([["a", { count: 1 }]]));
      let seen: { count: number } | null = null;
      const fn = jest.fn(() => {
        map.forEach((value) => {
          seen = value;
        });
      });

      effect(fn);
      expect(isReactive(seen)).toBe(true);

      map.set("b", { count: 2 });
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("WeakMap отслеживается по ключу", async () => {
      const key = {};
      const weak = reactive(new WeakMap<object, number>());
      const fn = jest.fn(() => {
        weak.get(key);
      });

      effect(fn);
      weak.set(key, 1);
      await nextTick();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("идентичность", () => {
    it("повторный вызов даёт ту же обёртку", () => {
      const raw = { a: 1 };
      expect(reactive(raw)).toBe(reactive(raw));
    });

    it("обёртка обёртки — она же", () => {
      const proxy = reactive({ a: 1 });
      expect(reactive(proxy)).toBe(proxy);
    });

    it("вложенное чтение стабильно", () => {
      const store = reactive({ nested: { a: 1 } });
      expect(store.nested).toBe(store.nested);
    });

    it("toRaw разворачивает, isReactive различает", () => {
      const raw = { a: 1 };
      const proxy = reactive(raw);

      expect(toRaw(proxy)).toBe(raw);
      expect(toRaw(raw)).toBe(raw);
      expect(isReactive(proxy)).toBe(true);
      expect(isReactive(raw)).toBe(false);
    });

    it("в состояние кладётся сырое значение", () => {
      const store = reactive<{ nested?: object }>({});
      const inner = reactive({ a: 1 });

      store.nested = inner;

      expect(toRaw(store).nested).toBe(toRaw(inner));
    });
  });

  describe("что не оборачивается", () => {
    it("примитивы и экзотические объекты", () => {
      const date = new Date();
      const re = /x/;

      expect(reactive(date)).toBe(date);
      expect(reactive(re)).toBe(re);
      expect(isReactive(reactive({ date }).date)).toBe(false);
    });

    it("markRaw", () => {
      const heavy = markRaw({ big: true });
      const store = reactive({ heavy });

      expect(isReactive(store.heavy)).toBe(false);
      expect(store.heavy).toBe(heavy);
    });

    it("замороженные объекты", () => {
      const frozen = Object.freeze({ a: 1 });
      const store = reactive({ frozen });

      expect(reactive(frozen)).toBe(frozen);
      expect(isReactive(store.frozen)).toBe(false);
    });
  });
});
