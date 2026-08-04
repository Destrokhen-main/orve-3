import { Computed, computed, OrvePluginType, state } from "orve";

export type UseStore = {
  num: Computed<number>,
  num2: Computed<number>,
  updateNum: (num: number) => void,
}

export const store: OrvePluginType = {
  setup(ctx) {
    const num = state(0);
    const num2 = computed(() => num.value * 2);

    const updateNum = (i: number) => {
      num.set(i);
    };

    ctx.store = {
      num: computed(() => num.value),
      num2,
      updateNum,
    }
  }
}