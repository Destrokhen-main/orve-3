import {
  For,
  State,
  computed,
  defineOptions,
  effect,
  effectScope,
  flushSync,
  nextTick,
  onScopeDispose,
  onUnmounted,
  state,
  untrack,
  watch,
} from "orve";

/**
 * Кейс: ядро реактивности без DOM-обвязки.
 *
 * Что проверяем:
 *  - watch: immediate, pause/resume (изменения из паузы догоняют одним вызовом), un();
 *  - untrack: чтение без подписки;
 *  - лень computed: пересчёт только на чтении;
 *  - equals: false — оповещение даже при том же значении;
 *  - effectScope: остановка гасит всё, что внутри, включая onScopeDispose;
 *  - батчинг: несколько set в одном тике = один прогон; flushSync разбирает
 *    очередь синхронно, nextTick — после неё.
 */

type Line = { id: number; text: string };

let lineId = 0;

export const Reactivity = () => {
  defineOptions({ single: true });

  const log = state<Line[]>([]);
  const say = (text: string) => log.set((v) => [{ id: lineId++, text }, ...v].slice(0, 20));

  /* ── watch ─────────────────────────────────────────────────────────── */
  const a = state(0);
  const paused = state(false);

  const w = watch(
    (next, prev) => say(`watch: ${String(prev)} → ${String(next)}`),
    a,
    { immediate: true },
  );

  /* ── computed: считаем пересчёты ───────────────────────────────────── */
  const recomputes = state(0);
  const doubled = computed(() => {
    recomputes.set((v) => v + 1);
    return a.value * 2;
  });
  const readDoubled = state("не читали");

  /* ── equals: false ─────────────────────────────────────────────────── */
  const loose = state(0, { equals: false });
  const looseHits = state(0);
  const strict = state(0);
  const strictHits = state(0);

  watch(() => looseHits.set((v) => v + 1), loose);
  watch(() => strictHits.set((v) => v + 1), strict);

  /* ── effectScope ───────────────────────────────────────────────────── */
  const scoped = state(0);
  const scopeRuns = state(0);
  let scope: ReturnType<typeof effectScope> | null = null;

  const startScope = () => {
    if (scope) {
      say("область уже запущена");
      return;
    }
    scope = effectScope(true);
    scope.run(() => {
      effect(() => {
        scoped.value;
        scopeRuns.set((v) => v + 1);
      });
      onScopeDispose(() => say("область остановлена: onScopeDispose"));
    });
    say("область запущена");
  };

  const stopScope = () => {
    scope?.stop();
    scope = null;
  };

  onUnmounted(stopScope);

  /* ── батчинг ───────────────────────────────────────────────────────── */
  const batched = state(0);
  const batchRuns = state(0);
  effect(() => {
    batched.value;
    batchRuns.set((v) => v + 1);
  });

  return () => (
    <section>
      <h2>Реактивность</h2>

      <h3>watch</h3>
      <p>
        a = <b>{a}</b>{" "}
        <button onClick={() => a.set((v) => v + 1)}>a + 1</button>{" "}
        <button
          onClick={() => {
            if (paused.peek()) {
              w.resume();
              paused.set(false);
              say("watch возобновлён — пропущенное придёт одним вызовом");
            } else {
              w.pause();
              paused.set(true);
              say("watch на паузе");
            }
          }}
        >
          {() => (paused.value ? "возобновить" : "поставить на паузу")}
        </button>{" "}
        <button
          onClick={() => {
            w.un();
            say("watch отписан навсегда");
          }}
        >
          отписать
        </button>
      </p>
      <p class="hint">
        на паузе нажми «a + 1» несколько раз — после возобновления придёт один
        вызов с последним значением
      </p>

      <h3>computed ленивый</h3>
      <p>
        пересчётов: <b>{recomputes}</b>, последнее прочитанное: <b>{readDoubled}</b>{" "}
        <button onClick={() => readDoubled.set(String(doubled.value))}>
          прочитать doubled
        </button>{" "}
        <button onClick={() => say(`untrack: a = ${untrack(() => a.value)}`)}>
          прочитать a через untrack
        </button>
      </p>
      <p class="hint">
        меняй a, не читая doubled: счётчик пересчётов стоит на месте, пока не
        нажмёшь «прочитать»
      </p>

      <h3>equals: false</h3>
      <p>
        <button onClick={() => loose.set(loose.peek())}>записать то же в loose</button>{" "}
        срабатываний: <b>{looseHits}</b>
      </p>
      <p>
        <button onClick={() => strict.set(strict.peek())}>записать то же в strict</button>{" "}
        срабатываний: <b>{strictHits}</b>
      </p>

      <h3>effectScope</h3>
      <p>
        прогонов эффекта в области: <b>{scopeRuns}</b>{" "}
        <button onClick={startScope}>запустить область</button>{" "}
        <button onClick={stopScope}>остановить</button>{" "}
        <button onClick={() => scoped.set((v) => v + 1)}>тронуть источник</button>
      </p>
      <p class="hint">после остановки «тронуть источник» больше не двигает счётчик</p>

      <h3>батчинг</h3>
      <p>
        прогонов эффекта: <b>{batchRuns}</b>{" "}
        <button
          onClick={() => {
            batched.set((v) => v + 1);
            batched.set((v) => v + 1);
            batched.set((v) => v + 1);
            say("три set подряд — эффект должен прогнаться один раз");
          }}
        >
          три set в одном тике
        </button>{" "}
        <button
          onClick={() => {
            const before = batchRuns.peek();
            batched.set((v) => v + 1);
            flushSync();
            say(`flushSync: прогонов было ${before}, стало ${batchRuns.peek()}`);
          }}
        >
          set + flushSync
        </button>{" "}
        <button
          onClick={async () => {
            batched.set((v) => v + 1);
            say(`сразу после set: ${batchRuns.peek()}`);
            await nextTick();
            say(`после nextTick: ${batchRuns.peek()}`);
          }}
        >
          set + nextTick
        </button>
      </p>

      <p>
        <button onClick={() => log.set([])}>очистить лог</button>
      </p>
      <ol class="log">
        <For each={log} by={(line: Line) => line.id}>
          {(line: State<Line>) => <li>{() => line.value.text}</li>}
        </For>
      </ol>
    </section>
  );
};
