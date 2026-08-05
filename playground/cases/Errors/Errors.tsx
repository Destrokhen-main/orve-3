import {
  Component,
  For,
  State,
  computed,
  defineOptions,
  effect,
  onMounted,
  onUnmounted,
  state,
  watch,
} from "orve";

/**
 * Кейс: что происходит при исключении.
 *
 * Границ ошибок в фреймворке нет — кейс фиксирует наблюдаемое поведение,
 * а не проверяет обещание. Каждый источник изолирован своей кнопкой:
 * setup, render, хук жизненного цикла, обработчик события, effect и watch.
 * Живой счётчик внизу показывает, продолжает ли работать остальная страница.
 */

const boom = (where: string): never => {
  throw new Error(`[кейс] исключение в ${where}`);
};

const ThrowInSetup = () => {
  boom("setup");
  return () => <p>не должно отрисоваться</p>;
};

const ThrowInRender = () => {
  const ok = state(true);
  return () => {
    if (!ok.value) {
      boom("render");
    }
    return (
      <p>
        render отработал.{" "}
        <button onClick={() => ok.set(false)}>уронить следующий render</button>
      </p>
    );
  };
};

const ThrowInMounted = () => {
  onMounted(() => boom("onMounted"));
  onMounted(() => console.info("[кейс] второй onMounted всё равно вызван"));
  return () => <p>смонтирован, первый хук упал</p>;
};

const ThrowInEffect = () => {
  const n = state(0);

  effect(() => {
    if (n.value > 0) {
      boom("effect");
    }
  });

  watch(
    () => {
      if (n.value > 1) {
        boom("watch");
      }
    },
    n,
  );

  return () => (
    <p>
      <button onClick={() => n.set((v) => v + 1)}>
        поднять счётчик (1 — упадёт effect, 2 — watch)
      </button>
    </p>
  );
};

const sources: { name: string; component: (() => unknown) | null }[] = [
  { name: "ничего", component: null },
  { name: "setup", component: ThrowInSetup },
  { name: "render", component: ThrowInRender },
  { name: "onMounted", component: ThrowInMounted },
  { name: "effect / watch", component: ThrowInEffect },
];

export const Errors = () => {
  defineOptions({ single: true });

  const picked = state(0);
  const target = computed(() => sources[picked.value].component as never);

  const ticks = state(0);
  const timer = setInterval(() => ticks.set((v) => v + 1), 500);
  onUnmounted(() => clearInterval(timer));

  return () => (
    <section>
      <h2>Исключения</h2>
      <p class="hint">
        границ ошибок нет: кейс показывает, что именно долетает до консоли и
        остаётся ли живой остальная страница. Смотри консоль.
      </p>

      <p>
        <For each={sources} by={(s: { name: string }) => s.name}>
          {(source: State<{ name: string }>, index: State<number>) => (
            <button onClick={() => picked.set(index.peek())}>
              {() => source.value.name}{" "}
            </button>
          )}
        </For>
      </p>

      <div class="pane">
        <Component is={target} />
      </div>

      <p>
        <button
          onClick={() => {
            boom("обработчике события");
          }}
        >
          уронить обработчик клика
        </button>
      </p>

      <p>
        независимый таймер (если он идёт — страница жива): <b>{ticks}</b>
      </p>
    </section>
  );
};
