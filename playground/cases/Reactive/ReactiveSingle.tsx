import { For, defineOptions, reactive } from "orve";

/**
 * Кейс: reactive() в сингл-режиме.
 *
 * render вызывается один раз, поэтому всё, что читает прокси, должно жить
 * внутри тонка `{() => …}` или внутри `each` у `<For>` — там чтение попадает
 * под подписку и обновляет только своё место в DOM.
 *
 * Что проверяем:
 *  - тонк со свойством прокси обновляется точечно;
 *  - <For each={() => [...list]}> реагирует на push/splice по месту;
 *  - мутация поля внутри строки обновляет только эту строку;
 *  - Map: size и итерация в тонках;
 *  - прямое чтение прокси в render (без тонка) застывает — показано рядом.
 */

type Task = { id: number; text: string; done: boolean };

let nextId = 3;

export const ReactiveSingle = () => {
  defineOptions({ single: true });

  const list = reactive<Task[]>([
    { id: 1, text: "первая", done: false },
    { id: 2, text: "вторая", done: false },
  ]);

  const user = reactive({ profile: { name: "аня", visits: 0 } });
  const settings = reactive(new Map<string, number>([["theme", 1]]));

  // сколько раз перерисовался слот — видно, что обновляется точечно
  const renders = { name: 0, list: 0 };

  return () => (
    <section>
      <h2>reactive + single</h2>

      <h3>тонк со свойством</h3>
      <p>
        имя: <b>{() => user.profile.name}</b>, визитов:{" "}
        <b>{() => user.profile.visits}</b>{" "}
        <span class="hint">
          {() => `(перерисовок слота с именем: ${++renders.name})`}
        </span>
      </p>
      <p>
        <button
          onClick={() => {
            user.profile.name = user.profile.name === "аня" ? "оля" : "аня";
          }}
        >
          сменить имя
        </button>{" "}
        <button onClick={() => (user.profile.visits += 1)}>визит +1</button>
      </p>
      <p class="hint">
        счётчик визитов меняется — слот с именем не перерисовывается: подписка
        идёт по каждому свойству отдельно
      </p>

      <h3>список</h3>
      <p class="hint">
        <code>each={"{() => [...list]}"}</code> — копия читает длину и индексы
        под подпиской. <code>each={"{() => list}"}</code> не сработает: чтение
        переменной не трогает ни одного свойства прокси.
      </p>
      <ul>
        <For each={() => [...list]} by={(task) => task.id}>
          {(task, index) => (
            <li>
              <input
                type="checkbox"
                checked={() => task.value.done}
                onChange={() => (task.value.done = !task.value.done)}
              />{" "}
              <span class={() => (task.value.done ? "done" : "")}>
                {() => `${index.value + 1}. ${task.value.text}`}
              </span>{" "}
              <button onClick={() => (task.value.text += "!")}>текст +!</button>{" "}
              <button
                onClick={() => list.splice(list.indexOf(task.value), 1)}
              >
                удалить
              </button>
            </li>
          )}
        </For>
      </ul>
      <p>
        <button
          onClick={() =>
            list.push({ id: nextId++, text: `задача ${nextId}`, done: false })
          }
        >
          push
        </button>{" "}
        <button onClick={() => list.reverse()}>reverse</button>{" "}
        <button onClick={() => (list.length = 0)}>очистить</button>{" "}
        <span class="hint">
          {() => `(перерисовок списка: ${++renders.list}, длина ${list.length})`}
        </span>
      </p>

      <h3>Map</h3>
      <p>
        size: <b>{() => settings.size}</b>
      </p>
      <ul>
        <For each={() => [...settings.entries()]} by={([key]) => key}>
          {(entry) => (
            <li>
              {() => `${entry.value[0]} = ${entry.value[1]}`}{" "}
              <button
                onClick={() =>
                  settings.set(entry.value[0], entry.value[1] + 1)
                }
              >
                +1
              </button>
            </li>
          )}
        </For>
      </ul>
      <p>
        <button onClick={() => settings.set(`opt-${settings.size}`, 0)}>
          добавить ключ
        </button>{" "}
        <button onClick={() => settings.clear()}>clear</button>
      </p>

      <h3>без тонка — застынет</h3>
      <p>
        длина списка, прочитанная прямо в render: <b>{list.length}</b>{" "}
        <span class="hint">
          render в сингле выполнился один раз, поэтому значение осталось
          с момента монтирования
        </span>
      </p>
    </section>
  );
};
