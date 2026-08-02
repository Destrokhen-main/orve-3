import { computed, state } from "../core/reactive";

/**
 * БАЗОВЫЙ режим — по умолчанию, маркер не нужен.
 *
 * Функция, которую вернул компонент, перевызывается на каждое изменение
 * прочитанной реактивности. В слотах пишем ЗНАЧЕНИЯ — `a.value`.
 * Дерево пересоздаётся целиком, в DOM уезжает только разница.
 */
const Counter = () => {
  const count = state(0);
  const double = computed(() => count.value * 2);

  // setup выполняется один раз: этот лог не повторится при обновлениях
  console.log("setup Counter");

  return () => (
    <div class="counter">
      {/* обычные выражения — render всё равно перевызовется */}
      <span>{count.value}</span>
      <span>{double.value}</span>

      {/* условие обычным JS: структура дерева свободно меняется */}
      {count.value > 3 && <b>много</b>}

      <button onClick={() => count.set((v) => v + 1)}>+1</button>
    </div>
  );
};

/**
 * Список — тоже обычный map. `key` нужен, чтобы diff сопоставлял узлы
 * между прогонами, а не пересоздавал их.
 */
const TodoList = () => {
  const items = state<string[]>(["первый", "второй"]);

  const add = () => {
    // новая ссылка — иначе Object.is не увидит изменения
    items.set((list) => [...list, `пункт ${list.length + 1}`]);
  };

  return () => (
    <ul>
      {items.value.map((text, i) => (
        <li key={i}>{text}</li>
      ))}
      <button onClick={add}>добавить</button>
    </ul>
  );
};

export const Basic = () => {
  return () => (
    <>
      <Counter />
      <TodoList />
    </>
  );
};
