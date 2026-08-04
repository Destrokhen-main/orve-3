import { computed, state } from "../../core/reactive/index.js";

/**
 * Тест типов, а не поведения: проверяет `tsc`, а не jest. Валидная разметка
 * должна компилироваться, невалидная — гаситься `@ts-expect-error`; лишняя
 * директива сама становится ошибкой, поэтому оба списка проверяются честно.
 */

const text = state("hi");
const count = state(0);
const flag = state(true);
const inputRef = state<HTMLInputElement | null>(null);
const upper = computed(() => text.value.toUpperCase());

const valid = () => (
  <div
    class={["a", { b: flag.value }]}
    style={{ color: "red", fontSize: 12, "--gap": "4px" }}
    data-id={count}
    aria-hidden={flag}
    role="main"
    title={upper}
  >
    <input
      ref={inputRef}
      type="number"
      value={count}
      disabled={flag}
      min={0}
      max={10}
      onInput={(e) => e.currentTarget.valueAsNumber}
      onClickCapture={(e) => e.clientX}
      onScroll={[() => {}, { passive: true }]}
    />
    <button type="submit" onClick={() => count.set((c: number) => c + 1)}>
      {upper}
    </button>
    <ul>
      {[1, 2].map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
    <svg viewBox="0 0 10 10" width={20}>
      <circle cx={5} cy={5} r={4} fill="red" stroke-width={2} />
    </svg>
    <my-widget foo="bar">веб-компонент</my-widget>
    <label for="x" class={() => (count.value > 0 ? "hot" : "cold")} />
  </div>
);

const invalid = () => (
  <div>
    {/* @ts-expect-error опечатка в имени атрибута */}
    <input clas="typo" />
    {/* @ts-expect-error не тот литерал */}
    <button type="sbumit" />
    {/* @ts-expect-error число вместо строки */}
    <a href={42} />
    {/* @ts-expect-error у void-тега не бывает детей */}
    <img src="a.png">текст</img>
    {/* @ts-expect-error в обработчик приходит MouseEvent */}
    <div onClick={(e: string) => e} />
    {/* @ts-expect-error ref другого элемента */}
    <div ref={inputRef} />
    {/* @ts-expect-error несуществующий тег */}
    <blink />
  </div>
);

describe("типы JSX", () => {
  it("проверяются компилятором", () => {
    expect(typeof valid).toBe("function");
    expect(typeof invalid).toBe("function");
  });
});
