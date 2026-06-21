import { computed } from "../computed";
import { nextTick } from "../core";
import { state } from "../state";

describe("reactive - object", () => {
  it("should call trigger object", async () => {
    const fn = jest.fn(() => {
      return obj.value.a;
    });
    const obj = state({
      a: 1,
      b: 1,
    });

    const b = computed(fn);
    b.value;
    obj.set({ ...obj.value, a: 2 });

    await nextTick();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should call trigger array", async () => {
    const fn = jest.fn(() => {
      return obj.value[0];
    });
    const obj = state([1, 2]);

    const b = computed(fn);
    b.value;
    const newArray = [...obj.value];
    newArray[0] = 2;
    obj.set(newArray);

    await nextTick();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
