import { state, computed } from "orve";

export const Basic = () => {
  const count = state(0);
  const double = computed(() => count.value * 2);

  return () => (
    <section>
      <h2>Базовый</h2>
      <p>
        {count.value} × 2 = {double.value}
      </p>
      {count.value > 2 && <p class="warn">больше двух</p>}
      <button onClick={() => count.set((v) => v + 1)}>+1</button>
    </section>
  );
};