import { state, computed, defineOptions, For, If, State } from "orve";

const Single = () => {
  defineOptions({
    single: true,
  });

  const count = state(0);
  const items = state<string[]>([]);

  return () => (
    <section>
      <h2>Сингл</h2>
      <p class={() => (count.value > 2 ? "warn" : "")}>{count}</p>

      <If
        when={() => count.value > 0}
        then={() => <p>уже что-то есть</p>}
        else={() => <p>пока ноль</p>}
      />

      <ul>
        <For each={items}>
          {(item: State<string>) => <li>{() => item.value}</li>}
        </For>
      </ul>

      <button
        onClick={() => {
          count.set((v) => v + 1);
          items.set((list) => [...list, `строка ${list.length + 1}`]);
        }}
      >
        +1
      </button>
    </section>
  );
};

const Base = () => {
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


export const Basic = () => {
  return () => (
    <>
      <Base />
      <Single />
    </>
  )
}