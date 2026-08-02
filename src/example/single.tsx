import { computed, state } from "../core/reactive";
import { single } from "../components/component";
import { For, If } from "../components/component-orve";

/**
 * СИНГЛ режим — объявляется маркером `single`.
 *
 * Функция, которую вернул компонент, вызывается РОВНО ОДИН РАЗ.
 * Дальше рантайм точечно правит те места DOM, куда попал сигнал.
 * Поэтому в слотах пишем сам сигнал — `{count}`, а не `{count.value}`.
 */
const Counter = single(() => {
  const count = state(0);
  const double = computed(() => count.value * 2);

  return () => (
    <div class="counter">
      {/* сигнал напрямую → микро-эффект только на этот текстовый узел */}
      <span>{count}</span>
      <span>{double}</span>

      {/* выражение → тонк; рантайм сам обернёт его в computed */}
      <span>{() => `${count.value} из 10`}</span>

      {/* атрибут — так же: сигнал или тонк */}
      <div class={() => (count.value > 3 ? "hot" : "cold")} />

      {/* пропсы с `on` — всегда обработчики, а не тонки */}
      <button onClick={() => count.set((v) => v + 1)}>+1</button>
    </div>
  );
});

/**
 * Структура дерева в сингле статична: обычный `if`/`map` выполнится один раз
 * и застынет. Динамика структуры — только через специальные узлы.
 */
const Dynamic = single(() => {
  const visible = state(false);
  const items = state(["первый", "второй"]);

  return () => (
    <div>
      {/* НЕ работает в сингле: выполнится один раз со значением false
          {visible.value && <b>виден</b>} */}
      <If when={visible} then={() => <b>виден</b>} />

      <ul>
        {/* For отдаёт значение строки и её индекс; key — чтобы строки
            переиспользовались, а не пересоздавались */}
        <For each={items}>
          {(item: string, index: number) => <li key={index}>{item}</li>}
        </For>
      </ul>

      <button onClick={() => visible.set((v) => !v)}>переключить</button>
    </div>
  );
});

export const Single = single(() => {
  return () => (
    <>
      <Counter />
      <Dynamic />
    </>
  );
});
