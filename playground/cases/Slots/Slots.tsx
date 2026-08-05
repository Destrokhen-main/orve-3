import { Child, For, State, defineOptions, state } from "orve";

/**
 * Кейс: children и пропсы-функции.
 *
 * Что проверяем:
 *  - обычные children уезжают внутрь как есть;
 *  - children-функция (scoped slot): фреймворк её не зовёт — компонент обязан
 *    вызвать сам, и именно поэтому шаблон получает данные ребёнка;
 *  - именованные слоты — просто пропсы-функции (header/footer);
 *  - проп-колбэк не должен быть выполнен как апдейтер при записи в ячейку;
 *  - объектный проп: замена объекта видна, мутация на месте — нет.
 */

const Card = (props: {
  title: string;
  header?: () => Child;
  footer?: () => Child;
  children?: Child;
}) => {
  defineOptions({ single: true });

  return () => (
    <div class="pane">
      <div class="dim">{() => props.header?.() ?? props.title}</div>
      <div>{() => props.children}</div>
      <div class="dim">{() => props.footer?.() ?? "—"}</div>
    </div>
  );
};

/** Scoped slot: ребёнок владеет данными, разметку даёт родитель. */
const Picker = (props: {
  options: string[];
  onPick?: (value: string) => void;
  children: (value: string, active: boolean) => Child;
}) => {
  defineOptions({ single: true });

  const active = state<string | null>(null);

  return () => (
    <div class="pane">
      <For each={() => props.options} by={(o: string) => o}>
        {(option: State<string>) => (
          <button
            onClick={() => {
              active.set(option.peek());
              props.onPick?.(option.peek());
            }}
          >
            {() => props.children(option.value, active.value === option.value)}{" "}
          </button>
        )}
      </For>
    </div>
  );
};

const ObjectProp = (props: { user: { name: string; age: number } }) => {
  defineOptions({ single: true });

  return () => (
    <div class="pane">
      имя: <b>{() => props.user.name}</b>, возраст: <b>{() => props.user.age}</b>
    </div>
  );
};

export const Slots = () => {
  defineOptions({ single: true });

  const picked = state("—");
  const calls = state(0);
  const user = state({ name: "Ада", age: 36 });

  return () => (
    <section>
      <h2>Слоты и пропсы-функции</h2>

      <h3>именованные слоты</h3>
      <Card
        title="заголовок по умолчанию"
        footer={() => <i>подвал из пропа</i>}
      >
        обычные children
      </Card>

      <h3>scoped slot</h3>
      <p class="hint">
        разметку кнопки задаёт родитель, а данные (активность) приходят из ребёнка
      </p>
      <Picker
        options={["один", "два", "три"]}
        onPick={(value: string) => {
          picked.set(value);
          calls.set((v) => v + 1);
        }}
      >
        {(value: string, active: boolean) => (active ? `→ ${value} ←` : value)}
      </Picker>
      <p>
        выбрано: <b>{picked}</b>, колбэк вызван раз: <b>{calls}</b>
      </p>
      <p class="hint">
        если бы проп-функция вызывалась при записи в ячейку, счётчик рос бы сам
      </p>

      <h3>объектный проп</h3>
      <ObjectProp user={user} />
      <p>
        <button onClick={() => user.set((v) => ({ ...v, age: v.age + 1 }))}>
          заменить объект (видно)
        </button>{" "}
        <button
          onClick={() => {
            user.peek().age += 1;
          }}
        >
          мутировать на месте (не видно)
        </button>{" "}
        <button onClick={() => user.set({ name: "Грейс", age: 45 })}>другой человек</button>
      </p>
    </section>
  );
};
