import {
  For,
  If,
  State,
  defineOptions,
  onMounted,
  state,
} from "orve";

/**
 * Кейс: ref.
 *
 * Что проверяем:
 *  - ref={fn} и ref={signal} получают узел;
 *  - при размонтировании в ref приходит null;
 *  - строка For переиспользуется, значит её ref повторно не дёргается.
 */

export const Refs = () => {
  defineOptions({ single: true });

  const boxRef = state<HTMLDivElement | null>(null);
  const inputRef = state<HTMLInputElement | null>(null);

  const size = state("—");
  const refLog = state<string[]>([]);
  const shown = state(true);

  const rows = state([1, 2, 3, 4]);
  const rowRefCalls = state(0);

  onMounted(() => {
    const el = boxRef.peek();
    size.set(el ? `${Math.round(el.getBoundingClientRect().width)}px` : "узла нет");
  });

  return () => (
    <section>
      <h2>ref</h2>

      <div ref={boxRef} class="pane">
        ширина этого блока, снятая в onMounted: <b>{size}</b>
      </div>

      <p>
        <input ref={inputRef} placeholder="ref-сигнал на инпуте" />{" "}
        <button onClick={() => inputRef.peek()?.focus()}>сфокусировать</button>{" "}
        <button onClick={() => inputRef.peek()?.select()}>выделить</button>
      </p>

      <p>
        <button onClick={() => shown.set((v) => !v)}>
          {() => (shown.value ? "снять блок" : "вернуть блок")}
        </button>{" "}
        <button onClick={() => refLog.set([])}>очистить</button>
      </p>

      <If
        when={shown}
        then={() => (
          <div
            class="pane"
            ref={(el: HTMLDivElement | null) =>
              refLog.set((v) => [...v, el ? `ref: <${el.tagName.toLowerCase()}>` : "ref: null"])
            }
          >
            у этого блока ref-функция: при снятии в неё придёт null
          </div>
        )}
      />

      <ul class="log">
        <For each={refLog}>
          {(line: State<string>) => <li>{() => line.value}</li>}
        </For>
      </ul>

      <h3>ref внутри строки списка</h3>
      <p class="hint">
        перестановка не пересобирает строки — счётчик вызовов ref не должен расти
      </p>
      <p>
        <button onClick={() => rows.set((v) => [...v].reverse())}>развернуть</button>{" "}
        <button onClick={() => rows.set((v) => [...v, Math.max(0, ...v) + 1])}>
          добавить
        </button>{" "}
        <button onClick={() => rows.set((v) => v.slice(0, -1))}>убрать последнюю</button>
      </p>
      <p>
        вызовов ref в строках: <b>{rowRefCalls}</b>
      </p>
      <ul>
        <For each={rows} by={(n: number) => n}>
          {(item: State<number>) => (
            <li ref={() => rowRefCalls.set((v) => v + 1)}>строка {() => item.value}</li>
          )}
        </For>
      </ul>
    </section>
  );
};
