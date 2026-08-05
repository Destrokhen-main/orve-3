import {
  Component,
  For,
  State,
  computed,
  defineOptions,
  onUnmounted,
  state,
} from "orve";

/**
 * Кейс: асинхронные гонки.
 *
 * Что проверяем:
 *  - устаревший ответ: запрос, начатый раньше, приходит позже и перетирает свежий;
 *  - защита через номер запроса и AbortController;
 *  - запись в сигнал после размонтирования компонента — область эффектов уже
 *    остановлена, поэтому патчить нечего; обрывать запрос нужно в onUnmounted.
 */

type Tab = { id: number; title: string; delay: number };

const tabs: Tab[] = [
  { id: 1, title: "медленная (1200 мс)", delay: 1200 },
  { id: 2, title: "средняя (600 мс)", delay: 600 },
  { id: 3, title: "быстрая (150 мс)", delay: 150 },
];

/** Фейковый запрос: ждёт delay и уважает abort. */
const load = (tab: Tab, signal?: AbortSignal) =>
  new Promise<string>((resolve, reject) => {
    const id = setTimeout(() => resolve(`данные вкладки «${tab.title}»`), tab.delay);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("aborted", "AbortError"));
    });
  });

const Naive = () => {
  defineOptions({ single: true });

  const result = state("—");
  const pending = state(0);

  const pick = (tab: Tab) => {
    pending.set((v) => v + 1);
    result.set(`загружаю «${tab.title}»…`);
    load(tab).then((data) => {
      pending.set((v) => v - 1);
      result.set(data);
    });
  };

  return () => (
    <div class="pane">
      <h3>наивно</h3>
      <p class="hint">
        нажми «медленная», сразу за ней «быстрая» — быстрый ответ придёт первым, а
        медленный перетрёт его секундой позже
      </p>
      <p>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => pick(tab)}>
            {tab.title}{" "}
          </button>
        ))}
      </p>
      <p>
        в полёте: {pending}, результат: <b>{result}</b>
      </p>
    </div>
  );
};

const Guarded = () => {
  defineOptions({ single: true });

  const result = state("—");
  const dropped = state(0);
  let token = 0;
  let controller: AbortController | null = null;

  const pick = (tab: Tab) => {
    // предыдущий запрос больше не нужен
    controller?.abort();
    controller = new AbortController();

    const mine = ++token;
    result.set(`загружаю «${tab.title}»…`);

    load(tab, controller.signal)
      .then((data) => {
        if (mine !== token) {
          dropped.set((v) => v + 1);
          return;
        }
        result.set(data);
      })
      .catch((error: unknown) => {
        if ((error as DOMException)?.name === "AbortError") {
          dropped.set((v) => v + 1);
          return;
        }
        throw error;
      });
  };

  onUnmounted(() => controller?.abort());

  return () => (
    <div class="pane">
      <h3>с отменой</h3>
      <p class="hint">та же последовательность — побеждает последний нажатый</p>
      <p>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => pick(tab)}>
            {tab.title}{" "}
          </button>
        ))}
      </p>
      <p>
        отброшено ответов: {dropped}, результат: <b>{result}</b>
      </p>
    </div>
  );
};

/** Пишет в свой сигнал через 1500 мс — успей размонтировать его до этого. */
const LateWriter = (props: { log: (message: string) => void }) => {
  defineOptions({ single: true });

  const text = state("жду ответ 1500 мс…");
  let alive = true;

  onUnmounted(() => {
    alive = false;
    props.log("LateWriter размонтирован");
  });

  load({ id: 0, title: "поздний", delay: 1500 }).then((data) => {
    props.log(`ответ пришёл, компонент жив: ${alive}`);
    text.set(data);
  });

  return () => <div class="pane">{text}</div>;
};

export const AsyncRace = () => {
  defineOptions({ single: true });

  const lines = state<string[]>([]);
  const log = (message: string) => lines.set((v) => [...v, message]);

  const shown = state(false);
  const target = computed(() => (shown.value ? LateWriter : null));

  return () => (
    <section>
      <h2>Асинхронные гонки</h2>

      <Naive />
      <Guarded />

      <h3>ответ после размонтирования</h3>
      <p>
        <button onClick={() => shown.set((v) => !v)}>
          {() => (shown.value ? "размонтировать" : "смонтировать")} компонент с
          запросом
        </button>{" "}
        <button onClick={() => lines.set([])}>очистить</button>
      </p>
      <Component is={target} log={log} />
      <ol class="log">
        <For each={lines} by={(_: string, i: number) => i}>
          {(line: State<string>) => <li>{() => line.value}</li>}
        </For>
      </ol>
    </section>
  );
};
