import { computed } from "../computed";
import { nextTick, setEffectOnces } from "../core";
import { state } from "../state";

describe("reactive", () => {
  describe("basic reactive [primitive]", () => {
    it("should update", async () => {
      const a = state(1);

      let i = 1;
      setEffectOnces(() => {
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

      setEffectOnces(fn);

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
      setEffectOnces(() => {
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
      expect(dFn).toHaveBeenCalledTimes(3);
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
  });
});
