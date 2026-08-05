import { For, State, defineOptions, state } from "orve";

/**
 * Кейс: события.
 *
 * Что проверяем:
 *  - порядок фаз: onClickCapture срабатывает до onClick;
 *  - кортеж [fn, { once: true }] и опции слушателя (passive);
 *  - stopPropagation обрывает всплытие;
 *  - при перерисовке старый слушатель снимается: на клик приходит ровно одна
 *    запись, а не по одной на каждую созданную версию обработчика;
 *  - делегирования нет — слушатель висит на каждом узле списка.
 */

type Line = { id: number; text: string };

let lineId = 0;

/**
 * Базовый компонент: render перевызывается, значит на каждой версии рождается
 * новое замыкание — ровно тот путь, где ElementView должен снять старый
 * слушатель и повесить новый.
 */
const HandlerSwap = (props: { say: (message: string) => void }) => {
  const version = state(1);

  return () => {
    const v = version.value;

    return (
      <div class="pane">
        <p class="hint">
          обработчик пересоздаётся вместе с версией; если старый не снимается,
          один клик даст несколько записей
        </p>
        <button onClick={() => version.set((n) => n + 1)}>
          новая версия обработчика (сейчас {v})
        </button>{" "}
        <button onClick={() => props.say(`сработал обработчик версии ${v}`)}>
          кликнуть текущей версией
        </button>
      </div>
    );
  };
};

export const Events = () => {
  defineOptions({ single: true });

  const log = state<Line[]>([]);
  const say = (text: string) =>
    log.set((v) => [{ id: lineId++, text }, ...v].slice(0, 14));

  const stop = state(false);
  const scrolls = state(0);
  const items = state([1, 2, 3, 4, 5]);

  return () => (
    <section>
      <h2>События</h2>

      <h3>фазы</h3>
      <div
        class="pane"
        onClickCapture={() => say("внешний: capture")}
        onClick={() => say("внешний: bubble")}
      >
        внешний
        <div
          class="pane"
          onClickCapture={() => say("· внутренний: capture")}
          onClick={(e: MouseEvent) => {
            if (stop.peek()) {
              e.stopPropagation();
              say("· внутренний: bubble + stopPropagation");
              return;
            }
            say("· внутренний: bubble");
          }}
        >
          внутренний — кликни сюда
        </div>
      </div>
      <p>
        <label>
          <input
            type="checkbox"
            checked={stop}
            onChange={(e: Event) => stop.set((e.target as HTMLInputElement).checked)}
          />{" "}
          внутренний обрывает всплытие
        </label>
      </p>

      <h3>опции слушателя</h3>
      <p>
        <button onClick={[() => say("once: сработал первый и последний раз"), { once: true }]}>
          once
        </button>{" "}
        <span class="hint">второй клик по этой кнопке ничего не добавит</span>
      </p>
      <div class="scroll pane" onScroll={[() => scrolls.set((v) => v + 1), { passive: true }]}>
        <div style="height: 300px">прокрути меня — passive-слушатель: {scrolls}</div>
      </div>

      <h3>замена обработчика</h3>
      <HandlerSwap say={say} />

      <h3>слушатель на каждой строке</h3>
      <p class="hint">делегирования нет: обработчик вешается на каждый узел списка</p>
      <p>
        <button onClick={() => items.set((v) => [...v].reverse())}>развернуть</button>{" "}
        <button onClick={() => items.set((v) => [...v, Math.max(0, ...v) + 1])}>добавить</button>
      </p>
      <ul>
        <For each={items} by={(n: number) => n}>
          {(item: State<number>) => (
            <li onClick={() => say(`клик по строке ${item.peek()}`)}>
              строка {() => item.value}
            </li>
          )}
        </For>
      </ul>

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
