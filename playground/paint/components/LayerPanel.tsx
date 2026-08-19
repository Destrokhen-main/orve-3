import { For, If, defineOptions, requirePlugin } from "orve";
import {
  duplicateShape,
  patchShape,
  removeShape,
  reorderShape,
  select,
  selectedId,
  shapes,
} from "../store/document.js";
import type { Shape } from "../types.js";

const KIND_ICON: Record<Shape["kind"], string> = {
  rect: "▭",
  ellipse: "◯",
  line: "╱",
  path: "✎",
};

/**
 * Список слоёв — витрина `<For>`.
 *
 * Колбэк строки вызывается один раз за её жизнь и получает `item` сигналом:
 * переименование или скрытие фигуры не пересобирает строку, обновляется
 * ровно тот текст или атрибут, который это значение читает.
 */
export const LayerPanel = () => {
  defineOptions({ single: true });

  const history = requirePlugin("$history");

  const edit = (label: string, run: () => void) => {
    history.record(label);
    run();
  };

  return () => (
    <section class="panel">
      <header class="panel__head">
        <h2 class="panel__title">Слои</h2>
        <span class="panel__hint">верхний рисуется поверх</span>
      </header>
      <div class="panel__body">
        <If
          when={() => shapes.value.length > 0}
          else={() => (
            <p class="empty">
              Холст пуст — выберите инструмент и проведите мышью.
            </p>
          )}
          then={() => (
            <ul class="layers">
              <For
                each={() => [...shapes.value].reverse()}
                by={(shape: Shape) => shape.id}
              >
                {(shape) => (
                  <li
                    class={() => ({
                      layer: true,
                      "is-active": selectedId.value === shape.value.id,
                      "is-hidden": !shape.value.visible,
                    })}
                    onClick={() => select(shape.value.id)}
                  >
                    <span class="layer__icon">
                      {() => KIND_ICON[shape.value.kind]}
                    </span>

                    <span class="layer__name">{() => shape.value.name}</span>

                    <span
                      class="layer__swatch"
                      style={() => ({
                        background:
                          shape.value.fill === "none"
                            ? "transparent"
                            : shape.value.fill,
                        borderColor: shape.value.stroke,
                      })}
                    />

                    <span class="layer__tools">
                      <button
                        type="button"
                        title="Показать / скрыть"
                        onClick:stop={() =>
                          edit("видимость", () =>
                            patchShape(shape.value.id, {
                              visible: !shape.value.visible,
                            }),
                          )
                        }
                      >
                        {() => (shape.value.visible ? "👁" : "🚫")}
                      </button>
                      <button
                        type="button"
                        title="Выше"
                        onClick:stop={() =>
                          edit("порядок", () => reorderShape(shape.value.id, 1))
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        title="Ниже"
                        onClick:stop={() =>
                          edit("порядок", () =>
                            reorderShape(shape.value.id, -1),
                          )
                        }
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        title="Дублировать"
                        onClick:stop={() =>
                          edit("дублирование", () =>
                            duplicateShape(shape.value.id),
                          )
                        }
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        title="Удалить"
                        onClick:stop={() =>
                          edit("удаление", () => removeShape(shape.value.id))
                        }
                      >
                        ✕
                      </button>
                    </span>
                  </li>
                )}
              </For>
            </ul>
          )}
        />
      </div>
    </section>
  );
};
