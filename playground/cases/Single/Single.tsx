import { state, If, For, defineOptions } from "orve";

export const Single = () => {

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
          {(item: string, index: number) => <li key={index}>{item}</li>}
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
