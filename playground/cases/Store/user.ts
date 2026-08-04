import { computed, state } from "orve";

let store: any = null;

function init() {
  const num = state(0);

  const num2 = computed(() => num.value * 2);

  const updateNum = (i: number) => {
    num.set(i);
  };

  return {
    num: computed(() => num.value),
    num2,
    updateNum,
  };
}

export function useStore() {
  if (store) {
    return store;
  }

  store = init();
  return store;
}

export function resetStore() {
  store = null;
}
