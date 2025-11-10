import { nextTick } from "../core";
import { state } from "../state"
import { watch } from "../watch"

describe('watch', () => {
  it('should called watch', () => {
    const a = state(1);

    watch((newValue) => {
      expect(newValue).toBe(2);
    }, a);

    a.set(2);
  })

  it('should called 2 watch reactive', () => {
    const a = state(1);
    const b = state(2);

    watch((newValue) => {
      expect(newValue).toStrictEqual([2,3]);
    }, [a, b]);

    a.set(2);
    b.set(3);
  })

  it('should correct return lastValue', () => {
    const a = state(1);

    watch((n, o) => {
      expect(n).toBe(2);
      expect(o).toBe(1);
    }, a);

    a.set(2);
  });

  it('should called 1 times', async () => {
    const a = state(1);

    const fn = jest.fn(() => {});
    const w = watch(fn, a);

    a.set(2);
    await nextTick();

    w.un();
    a.set(3);
    await nextTick();
    expect(fn).toHaveBeenCalledTimes(1);
  })

  it('should correct work pause', async () => {
    const a = state(1);

    const fn = jest.fn();
    const w = watch(fn, a);

    a.set(2);
    await nextTick();

    expect(fn).toHaveBeenCalledTimes(1);

    w.pause();
    a.set(3);
    await nextTick();
    expect(fn).toHaveBeenCalledTimes(1);

    w.resume();
    a.set(4);
    await nextTick();
    expect(fn).toHaveBeenCalledTimes(2);
  })
})