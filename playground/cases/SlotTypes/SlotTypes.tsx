import { Child, computed, defineOptions, state } from "orve";

/**
 * Кейс: смена типа содержимого слота.
 *
 * Один сигнал по очереди отдаёт текст, число, null, массив, элемент, фрагмент,
 * компонент. Проверяем patch: несовместимый тип должен заменяться целиком, а
 * соседи («до» и «после») — оставаться на своих местах, то есть якоря фрагментов
 * не должны сползать.
 */

const Widget = () => {
  const n = state(0);
  return () => (
    <b>
      компонент со своим состоянием: {n.value}{" "}
      <button onClick={() => n.set((v) => v + 1)}>+1</button>
    </b>
  );
};

const variants: { name: string; make: () => Child }[] = [
  { name: "строка", make: () => "просто текст" },
  { name: "число", make: () => 42 },
  { name: "null", make: () => null },
  { name: "false", make: () => false },
  { name: "элемент", make: () => <i>элемент i</i> },
  { name: "другой элемент", make: () => <u>элемент u</u> },
  {
    name: "массив узлов",
    make: () => [<span key="a">раз </span>, <span key="b">два </span>, <span key="c">три</span>],
  },
  { name: "фрагмент", make: () => <>фрагмент: <b>жирный</b> и <i>курсив</i></> },
  { name: "вложенный массив", make: () => [["a", "b"], <i key="i"> и элемент</i>] },
  { name: "компонент", make: () => <Widget /> },
  { name: "тот же компонент, другой проп", make: () => <Widget /> },
];

/** Тот же набор в базовом режиме: там слот — обычное значение из render. */
const BaseSide = (props: { index: number }) => {
  return () => (
    <div class="pane">
      <h3>базовый</h3>
      до [{variants[props.index].make()}] после
    </div>
  );
};

export const SlotTypes = () => {
  defineOptions({ single: true });

  const index = state(0);
  const current = computed(() => variants[index.value].make());
  const name = computed(() => `${index.value + 1}/${variants.length}: ${variants[index.value].name}`);

  return () => (
    <section>
      <h2>Типы слота</h2>

      <p>
        <button onClick={() => index.set((v) => (v + 1) % variants.length)}>дальше →</button>{" "}
        <button
          onClick={() => index.set((v) => (v - 1 + variants.length) % variants.length)}
        >
          ← назад
        </button>{" "}
        <b>{name}</b>
      </p>

      <div class="pane">
        <h3>сингл</h3>
        до [{current}] после
      </div>

      <BaseSide index={index} />
    </section>
  );
};
