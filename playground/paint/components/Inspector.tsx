import { requirePlugin } from "orve";
import {
  duplicateShape,
  patchShape,
  removeShape,
  selected,
  selectedBounds,
} from "../store/document.js";
import type { Shape } from "../types.js";
import { ColorField, Panel, Slider } from "./ui.js";

const KIND_NAME: Record<Shape["kind"], string> = {
  rect: "прямоугольник",
  ellipse: "эллипс",
  line: "линия",
  path: "кривая",
};

/**
 * Свойства выбранной фигуры — базовый компонент.
 *
 * Здесь режим по умолчанию удобнее сингла: форма целиком зависит от того,
 * что выделено, и проще перерисовать её всю, чем расставлять тонки. В слотах
 * поэтому значения (`selected.value`), а условия — обычный JS.
 */
export const Inspector = () => {
  const history = requirePlugin("$history");

  const change = (patch: Partial<Shape>) => {
    const shape = selected.peek();
    if (shape) {
      patchShape(shape.id, patch);
    }
  };

  const record = (label: string) => () => history.record(label);

  return () => {
    const shape = selected.value;

    if (!shape) {
      return (
        <Panel title="Свойства" hint="ничего не выбрано">
          <p class="empty">
            Возьмите инструмент «Выбор» и щёлкните по фигуре — здесь появятся её
            заливка, обводка и прозрачность.
          </p>
        </Panel>
      );
    }

    const box = selectedBounds.value;

    return (
      <Panel
        title="Свойства"
        hint={KIND_NAME[shape.kind]}
        data-kind={shape.kind}
      >
        <label class="field">
          <span class="field__label">Имя</span>
          <input
            class="text"
            value={shape.name}
            onFocus={record("имя")}
            onInput={(e) => change({ name: e.currentTarget.value })}
          />
        </label>

        <ColorField
          label="Заливка"
          value={shape.fill}
          onStart={record("заливка")}
          onPick={(fill) => change({ fill })}
        />

        <ColorField
          label="Обводка"
          value={shape.stroke}
          onStart={record("обводка")}
          onPick={(stroke) => change({ stroke })}
        />

        <Slider
          label="Толщина"
          value={shape.strokeWidth}
          min={0}
          max={40}
          suffix=" px"
          onStart={record("толщина")}
          onPick={(strokeWidth) => change({ strokeWidth })}
        />

        <Slider
          label="Прозрачность"
          value={Math.round(shape.opacity * 100)}
          min={5}
          max={100}
          suffix=" %"
          onStart={record("прозрачность")}
          onPick={(value) => change({ opacity: value / 100 })}
        />

        {box && (
          <dl class="metrics">
            <div>
              <dt>X</dt>
              <dd>{Math.round(box.x)}</dd>
            </div>
            <div>
              <dt>Y</dt>
              <dd>{Math.round(box.y)}</dd>
            </div>
            <div>
              <dt>Ширина</dt>
              <dd>{Math.round(box.width)}</dd>
            </div>
            <div>
              <dt>Высота</dt>
              <dd>{Math.round(box.height)}</dd>
            </div>
          </dl>
        )}

        <div class="row">
          <button
            type="button"
            class="ghost"
            onClick={() => {
              history.record("дублирование");
              duplicateShape(shape.id);
            }}
          >
            ⧉ Дублировать
          </button>
          <button
            type="button"
            class="ghost ghost--danger"
            onClick={() => {
              history.record("удаление");
              removeShape(shape.id);
            }}
          >
            ✕ Удалить
          </button>
        </div>
      </Panel>
    );
  };
};
