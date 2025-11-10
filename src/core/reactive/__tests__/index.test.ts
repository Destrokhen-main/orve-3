import { computed } from "../computed";
import { nextTick, setEffectOnces } from "../core";
import { state } from "../state"

describe("reactive", () => {
  describe("basic reactive [primitive]", () => {
    it("should update", async () => {
      const a = state(1);

      let i = 1;
      setEffectOnces(() => {
        expect(a.get()).toBe(i);
      })

      a.set(2);
      i = 2;
    });

    it("should call function only 2 timed", async () => {
      const a = state(1);

      const fn = jest.fn(() => {
        a.get()
      })

      setEffectOnces(fn)

      a.set(2);
      a.set(3);
      a.set(4);
      a.set(5);
      a.set(6);
      a.set(7);

      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2);
    })

    it('should correct get last number', () => {
      const a = state(1);

      let i = 1
      setEffectOnces(() => {
        expect(a.get()).toBe(i);
      })

      a.set(2);
      a.set(3);
      a.set(4);
      a.set(5);
      a.set(6);
      a.set(7);
      i = 7;
    })

    it('should correct update computed', async () => {
      const a = state(1);

      const b = computed(() => {
        return a.get();
      });

      expect(b.get()).toBe(1);
      a.set(2);
      await nextTick();
      expect(b.get()).toBe(2);
    })

    it('should correct update 2 state in computed', async () => {
      const a = state(1);
      const b = state(2);

      const c = computed(() => {
        return a.get() + b.get();
      })

      expect(c.get()).toBe(3);
      a.set(2);
      b.set(3);
      await nextTick();
      expect(c.get()).toBe(5);
    })

    it('should correct update computed', async () => {
      const flag = state(true);
      const a = state(1);
      const b = state(2);

      const fn = jest.fn(() => {
        if (flag.get()) {
          return a.get();
        } else {
          return b.get();
        }
      })

      const c = computed(fn);

      expect(c.get()).toBe(1);
      flag.set(false);
      await nextTick();
      expect(c.get()).toBe(2);
      a.set(2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2) 
    })

    it('should correct update computed', async () => {
      const flag = state(true);
      const a = state(1);
      const b = state(2);

      const fn = jest.fn(() => {
        if (flag.get()) {
          return a.get();
        } else {
          return b.get();
        }
      })

      const c = computed(fn);

      const dFn = jest.fn(() => {
        return c.get()
      })
      const d = computed(dFn);
      d.get();

      expect(c.get()).toBe(1);
      flag.set(false);
      await nextTick();
      expect(c.get()).toBe(2);
      a.set(2);
      await nextTick();
      expect(fn).toHaveBeenCalledTimes(2)
      expect(dFn).toHaveBeenCalledTimes(3);
    })
  })
})