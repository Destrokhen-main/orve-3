import { For, State, defineOptions, nextTick, state } from "orve";

/**
 * Кейс: For под нагрузкой.
 *
 * Что проверяем:
 *  - patchChildren на большом списке: shuffle, sort, вставка и удаление в середину;
 *  - колбэк строки вызывается один раз за её жизнь — счётчик это показывает;
 *  - by против сравнения по ссылке: без by иммутабельное обновление пересоздаёт всё;
 *  - вложенный For;
 *  - время от клика до разобранной очереди (nextTick).
 */

type Row = { id: number; name: string; weight: number };
type Group = { id: number; title: string; items: Row[] };

const makeRows = (count: number, from = 0): Row[] =>
  Array.from({ length: count }, (_, i) => ({
    id: from + i + 1,
    name: `строка ${from + i + 1}`,
    weight: Math.round(Math.random() * 100),
  }));

const shuffle = <T,>(list: T[]): T[] => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const Stress = () => {
  defineOptions({ single: true });

  const rows = state<Row[]>(makeRows(1000));
  const created = state(0);
  const took = state("—");

  const measure = async (label: string, action: () => void) => {
    const started = performance.now();
    action();
    await nextTick();
    took.set(`${label}: ${(performance.now() - started).toFixed(1)} мс`);
  };

  return () => (
    <div class="pane">
      <h3>1000 строк</h3>
      <p>
        <button onClick={() => measure("перемешать", () => rows.set((v) => shuffle(v)))}>
          перемешать
        </button>{" "}
        <button
          onClick={() =>
            measure("сортировка", () =>
              rows.set((v) => [...v].sort((a, b) => a.weight - b.weight)),
            )
          }
        >
          сортировать по весу
        </button>{" "}
        <button
          onClick={() =>
            measure("вставка в середину", () =>
              rows.set((v) => {
                const mid = Math.floor(v.length / 2);
                return [...v.slice(0, mid), ...makeRows(1, 10_000 + v.length), ...v.slice(mid)];
              }),
            )
          }
        >
          вставить в середину
        </button>{" "}
        <button
          onClick={() =>
            measure("удаление из середины", () =>
              rows.set((v) => {
                const mid = Math.floor(v.length / 2);
                return [...v.slice(0, mid), ...v.slice(mid + 1)];
              }),
            )
          }
        >
          удалить из середины
        </button>
      </p>
      <p>
        <button
          onClick={() =>
            measure("фильтр", () => rows.set((v) => v.filter((r) => r.weight % 2 === 0)))
          }
        >
          оставить чётные
        </button>{" "}
        <button
          onClick={() =>
            measure("иммутабельное обновление", () =>
              rows.set((v) => v.map((r) => ({ ...r, weight: r.weight }))),
            )
          }
        >
          пересоздать объекты (by спасает строки)
        </button>{" "}
        <button
          onClick={() =>
            measure("полная замена", () => {
              created.set(0);
              rows.set(makeRows(1000));
            })
          }
        >
          заново 1000
        </button>
      </p>
      <p>
        строк: <b>{() => rows.value.length}</b>, вызовов колбэка строки:{" "}
        <b>{created}</b>, <b>{took}</b>
      </p>

      <ul class="scroll">
        <For each={rows} by={(row: Row) => row.id}>
          {(row: State<Row>, index: State<number>) => {
            created.set((v) => v + 1);
            return (
              <li>
                <span class="dim">{() => index.value + 1}.</span> {() => row.value.name}{" "}
                <span style={() => `opacity: ${0.3 + row.value.weight / 150}`}>
                  вес {() => row.value.weight}
                </span>
              </li>
            );
          }}
        </For>
      </ul>
    </div>
  );
};

const ByVsRef = () => {
  defineOptions({ single: true });

  const list = state<Row[]>(makeRows(5));
  const withBy = state(0);
  const withoutBy = state(0);

  const remap = () => list.set((v) => v.map((r) => ({ ...r })));

  return () => (
    <div class="pane">
      <h3>by против сравнения по ссылке</h3>
      <p class="hint">
        «пересоздать объекты» отдаёт тот же список новыми объектами: слева строки
        живут дальше, справа — пересобираются целиком
      </p>
      <p>
        <button onClick={remap}>пересоздать объекты</button>{" "}
        <button onClick={() => list.set((v) => shuffle(v))}>перемешать</button>{" "}
        <button
          onClick={() => {
            withBy.set(0);
            withoutBy.set(0);
          }}
        >
          сбросить счётчики
        </button>
      </p>
      <div class="cols">
        <div>
          <b>c by</b>: вызовов колбэка {withBy}
          <ul>
            <For each={list} by={(row: Row) => row.id}>
              {(row: State<Row>) => {
                withBy.set((v) => v + 1);
                return <li>{() => row.value.name}</li>;
              }}
            </For>
          </ul>
        </div>
        <div>
          <b>без by</b>: вызовов колбэка {withoutBy}
          <ul>
            <For each={list}>
              {(row: State<Row>) => {
                withoutBy.set((v) => v + 1);
                return <li>{() => row.value.name}</li>;
              }}
            </For>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Nested = () => {
  defineOptions({ single: true });

  const groups = state<Group[]>(
    Array.from({ length: 3 }, (_, g) => ({
      id: g + 1,
      title: `группа ${g + 1}`,
      items: makeRows(3, g * 3),
    })),
  );

  return () => (
    <div class="pane">
      <h3>вложенный For</h3>
      <p>
        <button onClick={() => groups.set((v) => shuffle(v))}>перемешать группы</button>{" "}
        <button
          onClick={() =>
            groups.set((v) =>
              v.map((g) => (g.id === 1 ? { ...g, items: shuffle(g.items) } : g)),
            )
          }
        >
          перемешать внутри первой
        </button>
      </p>
      <For each={groups} by={(g: Group) => g.id}>
        {(group: State<Group>) => (
          <div>
            <b>{() => group.value.title}</b>
            <ul>
              <For each={() => group.value.items} by={(row: Row) => row.id}>
                {(row: State<Row>) => <li>{() => row.value.name}</li>}
              </For>
            </ul>
          </div>
        )}
      </For>
    </div>
  );
};

export const ForStress = () => {
  defineOptions({ single: true });

  return () => (
    <section>
      <h2>For под нагрузкой</h2>
      <Stress />
      <ByVsRef />
      <Nested />
    </section>
  );
};
