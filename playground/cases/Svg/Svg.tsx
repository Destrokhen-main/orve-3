import { For, If, State, computed, defineOptions, state } from "orve";

/**
 * Кейс: SVG и пространства имён.
 *
 * Что проверяем:
 *  - узлы внутри <svg> создаются в SVG-пространстве, атрибуты идут setAttribute;
 *  - camelCase-имена (viewBox, strokeWidth → stroke-width) не ломаются;
 *  - узел, появившийся внутри svg позже (If, For, слот), тоже попадает в SVG:
 *    пространство фиксируется в конструкторе отложенных View;
 *  - foreignObject возвращает HTML-пространство;
 *  - один и тот же слот, переключающийся между svg и html.
 */

export const Svg = () => {
  defineOptions({ single: true });

  const r = state(30);
  const color = state("tomato");
  const extra = state(false);
  const dots = state([1, 2, 3]);
  const asSvg = state(true);

  const label = computed(() => `r = ${r.value}`);
  const swap = computed(() =>
    asSvg.value ? (
      <svg width="60" height="60" viewBox="0 0 60 60">
        <rect x="5" y="5" width="50" height="50" fill="steelblue" rx="8" />
      </svg>
    ) : (
      <div class="pane">обычный HTML на том же месте</div>
    ),
  );

  return () => (
    <section>
      <h2>SVG</h2>

      <p>
        <button onClick={() => r.set((v) => Math.min(60, v + 5))}>больше</button>{" "}
        <button onClick={() => r.set((v) => Math.max(5, v - 5))}>меньше</button>{" "}
        <button onClick={() => color.set(color.peek() === "tomato" ? "seagreen" : "tomato")}>
          цвет
        </button>{" "}
        <button onClick={() => extra.set((v) => !v)}>
          {() => (extra.value ? "убрать" : "добавить")} узел внутрь svg
        </button>{" "}
        <button onClick={() => dots.set((v) => (v.length > 5 ? [1, 2, 3] : [...v, v.length + 1]))}>
          точки: {() => dots.value.length}
        </button>
      </p>

      <svg width="320" height="160" viewBox="0 0 320 160" class="pane">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="gold" />
            <stop offset="100%" stop-color="crimson" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="320" height="160" fill="url(#grad)" opacity="0.15" />

        <circle
          cx="70"
          cy="80"
          r={r}
          fill={color}
          stroke="black"
          stroke-width={() => (r.value > 30 ? 3 : 1)}
        />

        {/* появляется по условию — должен создаться в SVG-пространстве */}
        <If
          when={extra}
          then={() => (
            <g transform="translate(150 40)">
              <rect width="40" height="40" fill="rebeccapurple" />
              <text x="0" y="60" font-size="12" fill="currentColor">
                добавлен через If
              </text>
            </g>
          )}
        />

        {/* список внутри svg */}
        <For each={dots} by={(n: number) => n}>
          {(item: State<number>) => (
            <circle cy="140" r="6" cx={() => 20 + item.value * 24} fill="black" />
          )}
        </For>

        {/* реактивный текстовый слот внутри svg */}
        <text x="20" y="20" font-size="14" fill="currentColor">
          {label}
        </text>

        {/* внутри foreignObject снова HTML */}
        <foreignObject x="200" y="90" width="110" height="60">
          <div class="pane" style="font-size: 12px; padding: 4px">
            html внутри svg
          </div>
        </foreignObject>
      </svg>

      <p>
        <button onClick={() => asSvg.set((v) => !v)}>переключить svg / html в слоте</button>
      </p>
      {swap}
    </section>
  );
};
