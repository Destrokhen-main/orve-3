import { state } from "../core/reactive";
import { single } from "../components/component";


type BadgeProps = { label: string; count: number };

/**
 * Сингл-ребёнок. Его render не перевызовется никогда — даже когда
 * родитель перерисуется. Пропсы читаются как `props.count` (без `.value`):
 * под каждым пропом лежит реактивная ячейка, поэтому обращение к нему
 * внутри слота/тонка трекается, а родитель при обновлении пишет в ячейку.
 */
const Badge = single((props: BadgeProps) => {
  return () => (
    <span class="badge">
      {() => `${props.label}: ${props.count}`}
    </span>
  );
});

/**
 * Базовый-родитель. Перевызывается на каждое изменение `count`,
 * но Badge при этом не пересоздаётся — обновляются только его пропсы.
 */
export const Mixed = () => {
  const count = state(0);

  return () => (
    <div>
      <Badge label="кликов" count={count.value} />

      {/* ВАЖНО: деструктуризация пропсов рвёт реактивность —
          const { count } = props; заберёт значение один раз */}

      <button onClick={() => count.update((v) => v + 1)}>+1</button>
    </div>
  );
};

// Тип пропсов пишется по значениям. Снаружи JSX разрешит передать
// сюда и сигнал (`items={items}`) — рантайм развернёт его сам.
type ListProps = { items: string[] };

/**
 * Обратная связка: сингл-родитель, базовый-ребёнок.
 *
 * Сингл-родитель не перевызывает render, поэтому передаёт сам сигнал —
 * `items={items}`. Рантайм разворачивает его в ячейку пропа, и ребёнок
 * видит обычный `string[]`; в типах это `MaybeReactive<T>` на входе.
 * У базового ребёнка свой render-эффект — он подпишется на `props.items`
 * сам, когда прочитает его в своём render.
 */
const Rows = (props: ListProps) => {
  return () => (
    <ul>
      {props.items.map((row, i) => (
        <li key={i}>{row}</li>
      ))}
    </ul>
  );
};

export const MixedReverse = single(() => {
  const items = state(["a", "b"]);

  return () => (
    <div>
      <Rows items={items} />
      <button onClick={() => items.update((list) => [...list, "ещё"])}>
        добавить
      </button>
    </div>
  );
});
