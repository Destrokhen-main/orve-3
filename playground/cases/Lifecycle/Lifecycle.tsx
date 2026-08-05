import {
  Component,
  For,
  If,
  State,
  computed,
  defineOptions,
  onBeforeUnmounted,
  onMounted,
  onUnmounted,
  state,
} from "orve";

/**
 * Кейс: порядок хуков жизненного цикла.
 *
 * Что проверяем:
 *  - onMounted отложен и идёт снизу вверх: дети раньше родителей;
 *  - onBeforeUnmounted видит живой DOM, onUnmounted — уже снятый;
 *  - обновление пропсов не перезапускает setup, поэтому onMounted ровно один раз;
 *  - исключение в хуке логируется и не роняет соседей.
 */

const log = state<string[]>([]);
const record = (message: string) => log.set((v) => [...v, message]);

const Leaf = (props: { n: number }) => {
  record("· setup Leaf");

  onMounted(() => record("· Leaf onMounted"));
  onBeforeUnmounted(() => {
    const alive = document.querySelector("[data-leaf]") !== null;
    record(`· Leaf onBeforeUnmounted (узел в документе: ${alive})`);
  });
  onUnmounted(() => {
    const alive = document.querySelector("[data-leaf]") !== null;
    record(`· Leaf onUnmounted (узел в документе: ${alive})`);
  });

  return () => <li data-leaf>лист, проп n = {props.n}</li>;
};

const Middle = (props: { n: number }) => {
  record("·· setup Middle");

  onMounted(() => record("·· Middle onMounted"));
  onBeforeUnmounted(() => record("·· Middle onBeforeUnmounted"));
  onUnmounted(() => record("·· Middle onUnmounted"));

  return () => (
    <ul>
      <Leaf n={props.n} />
    </ul>
  );
};

const Root = (props: { n: number }) => {
  record("··· setup Root");

  onMounted(() => record("··· Root onMounted"));
  onBeforeUnmounted(() => record("··· Root onBeforeUnmounted"));
  onUnmounted(() => record("··· Root onUnmounted"));

  return () => (
    <div class="tree">
      <Middle n={props.n} />
    </div>
  );
};

/** Первый onMounted падает — второй обязан отработать, монтирование не рушится. */
const Boom = () => {
  onMounted(() => {
    throw new Error("[кейс] специально брошено из первого onMounted");
  });
  onMounted(() => record("!! Boom: второй onMounted всё равно вызван"));
  onUnmounted(() => record("!! Boom onUnmounted"));

  return () => <p>компонент с падающим хуком (смотри консоль)</p>;
};

export const Lifecycle = () => {
  defineOptions({ single: true });

  const shown = state(true);
  const boom = state(false);
  const n = state(0);

  const tree = computed(() => (shown.value ? Root : null));
  const boomTarget = computed(() => (boom.value ? Boom : null));

  return () => (
    <section>
      <h2>Жизненный цикл</h2>

      <p>
        <button onClick={() => shown.set((v) => !v)}>
          {() => (shown.value ? "размонтировать дерево" : "смонтировать дерево")}
        </button>{" "}
        <button onClick={() => n.set((v) => v + 1)}>
          обновить проп (setup не должен повториться)
        </button>{" "}
        <button onClick={() => boom.set((v) => !v)}>
          {() => (boom.value ? "убрать падающий хук" : "смонтировать падающий хук")}
        </button>{" "}
        <button onClick={() => log.set([])}>очистить лог</button>
      </p>

      <div class="pane">
        <Component is={tree} n={n} />
        <Component is={boomTarget} />
      </div>

      <If
        when={() => log.value.length === 0}
        then={() => <p class="hint">лог пуст</p>}
        else={() => (
          <ol class="log">
            <For each={log}>
              {(line: State<string>) => <li>{() => line.value}</li>}
            </For>
          </ol>
        )}
      />
    </section>
  );
};
