import { computed, defineOptions, state } from "orve";

/**
 * Кейс: формы.
 *
 * Двустороннего связывания нет — значение пишется руками в onInput/onChange.
 * Что проверяем:
 *  - value/checked/selected ставятся как DOM-свойства, а не атрибуты;
 *  - повторная запись того же value не трогает узел и не сбивает курсор;
 *  - select (одиночный и multiple), radio-группа, textarea, number, флаги.
 */

export const Forms = () => {
  defineOptions({ single: true });

  const text = state("привет");
  const num = state(10);
  const about = state("многострочное\nполе");
  const agree = state(false);
  const size = state("m");
  const city = state("spb");
  const tags = state<string[]>(["a"]);
  const disabled = state(false);

  const dump = computed(() =>
    JSON.stringify(
      {
        text: text.value,
        num: num.value,
        about: about.value,
        agree: agree.value,
        size: size.value,
        city: city.value,
        tags: tags.value,
        disabled: disabled.value,
      },
      null,
      2,
    ),
  );

  return () => (
    <section>
      <h2>Формы</h2>

      <p>
        <label>
          текст{" "}
          <input
            value={text}
            disabled={disabled}
            onInput={(e: Event) => text.set((e.target as HTMLInputElement).value)}
          />
        </label>{" "}
        <button onClick={() => text.set(text.peek())}>
          записать то же значение
        </button>{" "}
        <button onClick={() => text.set("сброшено")}>записать другое</button>
      </p>
      <p class="hint">
        поставь курсор в середину поля и нажми «записать то же значение» — курсор
        не должен прыгнуть в конец; «записать другое» перепишет поле целиком
      </p>

      <p>
        <label>
          число{" "}
          <input
            type="number"
            value={num}
            min="0"
            max="100"
            onInput={(e: Event) => num.set(Number((e.target as HTMLInputElement).value))}
          />
        </label>{" "}
        <button onClick={() => num.set((v) => v + 5)}>+5</button>
      </p>

      <p>
        <label>
          textarea{" "}
          <textarea
            value={about}
            rows={3}
            onInput={(e: Event) => about.set((e.target as HTMLTextAreaElement).value)}
          />
        </label>
      </p>

      <p>
        <label>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e: Event) => agree.set((e.target as HTMLInputElement).checked)}
          />{" "}
          согласен
        </label>{" "}
        <button onClick={() => agree.set((v) => !v)}>переключить извне</button>
      </p>

      <p>
        размер:{" "}
        {["s", "m", "l"].map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="size"
              value={value}
              checked={() => size.value === value}
              onChange={() => size.set(value)}
            />{" "}
            {value}{" "}
          </label>
        ))}
        <button onClick={() => size.set("l")}>выбрать l извне</button>
      </p>

      <p>
        <label>
          город{" "}
          <select
            value={city}
            onChange={(e: Event) => city.set((e.target as HTMLSelectElement).value)}
          >
            <option value="msk">Москва</option>
            <option value="spb">Петербург</option>
            <option value="nsk">Новосибирск</option>
          </select>
        </label>{" "}
        <button onClick={() => city.set("nsk")}>выбрать извне</button>
      </p>

      <p>
        <label>
          теги (multiple){" "}
          <select
            multiple
            size={3}
            onChange={(e: Event) =>
              tags.set(
                Array.from((e.target as HTMLSelectElement).selectedOptions).map(
                  (o) => o.value,
                ),
              )
            }
          >
            {["a", "b", "c"].map((value) => (
              <option key={value} value={value} selected={() => tags.value.includes(value)}>
                {value}
              </option>
            ))}
          </select>
        </label>{" "}
        <button onClick={() => tags.set(["b", "c"])}>выбрать b+c извне</button>
      </p>

      <p>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e: Event) => disabled.set((e.target as HTMLInputElement).checked)}
          />{" "}
          disabled на текстовом поле (атрибут-флаг)
        </label>
      </p>

      <pre class="pane">{dump}</pre>
    </section>
  );
};
