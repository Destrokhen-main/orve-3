import { computed } from "../computed/index.js";
import { effect, nextTick } from "../core/index.js";
import { reactive } from "../reactive/index.js";
import { state } from "../state/index.js";

describe("reactive", () => {
  describe("basic reactive [primitive]", () => {
    it("should update", async () => {
      const a = state(1);

      let i = 1;
      effect(() => {
        expect(a.value).toBe(i);
      });

      a.set(2);
      i = 2;
    });

    it("should call function only 2 timed", async () => {
      const a = state(1);

      const fn = jest.fn(() => {
        a.value;
      });

      effect(fn);

      a.set(2);
      a.set(3);
      a.set(4);
      a.set(5);
      a.set(6);
      a.set(7);

      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should correct get last number", () => {
      const a = state(1);

      let i = 1;
      effect(() => {
        expect(a.value).toBe(i);
      });

      a.set(2);
      a.set(3);
      a.set(4);
      a.set(5);
      a.set(6);
      a.set(7);
      i = 7;
    });

    it("should correct update computed", async () => {
      const a = state(1);

      const b = computed(() => {
        return a.value;
      });

      expect(b.value).toBe(1);
      a.set(2);
      await nextTick();
      expect(b.value).toBe(2);
    });

    it("should correct update 2 state in computed", async () => {
      const a = state(1);
      const b = state(2);

      const c = computed(() => {
        return a.value + b.value;
      });

      expect(c.value).toBe(3);
      a.set(2);
      b.set(3);
      await nextTick();
      expect(c.value).toBe(5);
    });

    it("should correct update computed", async () => {
      const flag = state(true);
      const a = state(1);
      const b = state(2);

      const fn = jest.fn(() => {
        if (flag.value) {
          return a.value;
        } else {
          return b.value;
        }
      });

      const c = computed(fn);

      expect(c.value).toBe(1);
      flag.set(false);
      await nextTick();
      expect(c.value).toBe(2);
      a.set(2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should correct update computed", async () => {
      const flag = state(true);
      const a = state(1);
      const b = state(2);

      const fn = jest.fn(() => {
        if (flag.value) {
          return a.value;
        } else {
          return b.value;
        }
      });

      const c = computed(fn);

      const dFn = jest.fn(() => {
        return c.value;
      });
      const d = computed(dFn);
      d.value;

      expect(c.value).toBe(1);
      flag.set(false);
      await nextTick();
      expect(c.value).toBe(2);
      a.set(2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);

      // d ленивый: пока его не читают, он не пересчитывается,
      // но инвалидация через c до него дошла
      expect(dFn).toHaveBeenCalledTimes(1);
      expect(d.value).toBe(2);
      expect(dFn).toHaveBeenCalledTimes(2);
    });

    it("should correct update computed (custom list dep)", async () => {
      const a = state(1);
      const b = state(2);

      const fn = jest.fn(() => {
        return a.value + b.value;
      });

      const c = computed(fn, { deps: [a] });

      expect(c.value).toBe(3);
      await nextTick();

      b.set(b.value + 1);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    describe("deps с reactive()", () => {
      it("реактивный объект в deps будит пересчёт", async () => {
        const store = reactive({ a: 1, b: 2 });

        const fn = jest.fn(() => store.a + store.b);
        const c = computed(fn, { deps: [store] });

        expect(c.value).toBe(3);
        expect(fn).toHaveBeenCalledTimes(1);

        store.b = 10;
        await nextTick();
        expect(c.value).toBe(11);
        expect(fn).toHaveBeenCalledTimes(2);
      });

      it("подписка идёт вглубь, включая массивы и новые ключи", async () => {
        const store = reactive({ user: { name: "аня" }, tags: ["a"] });

        const fn = jest.fn(
          () => `${store.user.name}:${store.tags.join(",")}`,
        );
        const c = computed(fn, { deps: [store] });

        expect(c.value).toBe("аня:a");

        store.user.name = "оля";
        await nextTick();
        expect(c.value).toBe("оля:a");

        store.tags.push("b");
        await nextTick();
        expect(c.value).toBe("оля:a,b");
        expect(fn).toHaveBeenCalledTimes(3);
      });

      it("циклическая ссылка не зацикливает обход", () => {
        const store: any = reactive({ a: 1 });
        store.self = store;

        const c = computed(() => store.a, { deps: [store] });
        expect(c.value).toBe(1);
      });

      it("Map в deps: изменение содержимого инвалидирует", async () => {
        const store = reactive(new Map<string, number>([["a", 1]]));

        const fn = jest.fn(() => store.get("a") ?? 0);
        const c = computed(fn, { deps: [store] });

        expect(c.value).toBe(1);

        store.set("a", 5);
        await nextTick();
        expect(c.value).toBe(5);
        expect(fn).toHaveBeenCalledTimes(2);
      });

      it("геттер в deps сужает подписку до одной ветки", async () => {
        const store = reactive({ a: 1, b: 2 });

        const fn = jest.fn(() => store.a + store.b);
        const c = computed(fn, { deps: [() => store.a] });

        expect(c.value).toBe(3);

        // b не в deps — пересчёта нет
        store.b = 10;
        await nextTick();
        expect(c.value).toBe(3);
        expect(fn).toHaveBeenCalledTimes(1);

        store.a = 2;
        await nextTick();
        expect(c.value).toBe(12);
        expect(fn).toHaveBeenCalledTimes(2);
      });

      it("State и reactive можно смешивать в одном списке", async () => {
        const flag = state(false);
        const store = reactive({ a: 1 });

        const fn = jest.fn(() => (flag.value ? store.a : 0));
        const c = computed(fn, { deps: [flag, store] });

        expect(c.value).toBe(0);

        store.a = 7;
        await nextTick();
        expect(c.value).toBe(0);
        expect(fn).toHaveBeenCalledTimes(2);

        flag.set(true);
        await nextTick();
        expect(c.value).toBe(7);
      });
    });
  });
});
