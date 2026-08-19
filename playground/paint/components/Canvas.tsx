import { For, defineOptions, requirePlugin, state, type Child } from "orve";
import {
  addShape,
  brush,
  cursor,
  nextId,
  patchShape,
  removeShape,
  select,
  selectedBounds,
  selectedId,
  shapes,
  tool,
} from "../store/document.js";
import { normalizeRect, pathD, snapTo, translate } from "../store/geometry.js";
import type { Point, Shape } from "../types.js";

/** Общие для всех фигур атрибуты — дальше дописываются геометрией. */
const paint = (shape: Shape) => ({
  fill: shape.fill,
  stroke: shape.stroke,
  "stroke-width": shape.strokeWidth,
  "stroke-linecap": "round" as const,
  "stroke-linejoin": "round" as const,
  opacity: shape.opacity,
});

/**
 * Разбор фигуры в SVG-узел. Функция, а не компонент: тег зависит от вида
 * фигуры, а его подменой занимается реконсилятор — узел с другим `type`
 * он просто заменит целиком.
 */
function shapeNode(
  shape: Shape,
  onDown?: (event: PointerEvent, shape: Shape) => void,
): Child {
  if (!shape.visible) {
    return null;
  }

  const common = paint(shape);
  const cls = onDown ? "shape" : "shape shape--draft";
  const handler = onDown
    ? (event: PointerEvent) => onDown(event, shape)
    : undefined;

  switch (shape.kind) {
    case "rect":
      return (
        <rect
          {...common}
          class={cls}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          onPointerdown={handler}
        />
      );
    case "ellipse":
      return (
        <ellipse
          {...common}
          class={cls}
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          onPointerdown={handler}
        />
      );
    case "line":
      return (
        <line
          {...common}
          class={cls}
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
          onPointerdown={handler}
        />
      );
    case "path":
      return (
        <path
          {...common}
          class={cls}
          fill="none"
          d={pathD(shape.points)}
          onPointerdown={handler}
        />
      );
  }
}

/**
 * Холст. Сингл-компонент: render отрабатывает один раз, а всё живое
 * сидит в слотах-тонках и в `<For>`.
 */
export const Canvas = () => {
  defineOptions({ single: true });

  const history = requirePlugin("$history");

  /** Черновик текущего мазка — в документ он попадёт только на отпускании. */
  const draft = state<Shape | null>(null);

  let surface: SVGSVGElement | null = null;
  let origin: Point | null = null;
  let drag: { id: string; from: Point; base: Shape; moved: boolean } | null =
    null;

  const at = (event: PointerEvent): Point => {
    const box = surface?.getBoundingClientRect();
    const raw = {
      x: event.clientX - (box?.left ?? 0),
      y: event.clientY - (box?.top ?? 0),
    };

    return brush.snap
      ? { x: snapTo(raw.x, brush.gridStep), y: snapTo(raw.y, brush.gridStep) }
      : raw;
  };

  const style = () => ({
    name: "",
    visible: true,
    fill: brush.fill,
    stroke: brush.stroke,
    strokeWidth: brush.strokeWidth,
    opacity: brush.opacity,
  });

  const startDraft = (p: Point): Shape | null => {
    const base = style();

    switch (tool.peek()) {
      case "rect":
        return {
          ...base,
          id: nextId("rect"),
          kind: "rect",
          name: "Прямоугольник",
          x: p.x,
          y: p.y,
          width: 0,
          height: 0,
        };
      case "ellipse":
        return {
          ...base,
          id: nextId("ellipse"),
          kind: "ellipse",
          name: "Эллипс",
          cx: p.x,
          cy: p.y,
          rx: 0,
          ry: 0,
        };
      case "line":
        return {
          ...base,
          id: nextId("line"),
          kind: "line",
          name: "Линия",
          fill: "none",
          x1: p.x,
          y1: p.y,
          x2: p.x,
          y2: p.y,
        };
      case "pen":
        return {
          ...base,
          id: nextId("path"),
          kind: "path",
          name: "Кривая",
          fill: "none",
          points: [p],
        };
      default:
        return null;
    }
  };

  const growDraft = (shape: Shape, p: Point): Shape => {
    const from = origin ?? p;

    switch (shape.kind) {
      case "rect":
        return { ...shape, ...normalizeRect(from, p) };
      case "ellipse": {
        const box = normalizeRect(from, p);
        return {
          ...shape,
          cx: box.x + box.width / 2,
          cy: box.y + box.height / 2,
          rx: box.width / 2,
          ry: box.height / 2,
        };
      }
      case "line":
        return { ...shape, x2: p.x, y2: p.y };
      case "path": {
        const last = shape.points[shape.points.length - 1];
        if (last && Math.hypot(p.x - last.x, p.y - last.y) < 3) {
          return shape;
        }
        return { ...shape, points: [...shape.points, p] };
      }
    }
  };

  /** Годится ли черновик в документ: случайный клик не должен плодить точки. */
  const meaningful = (shape: Shape) => {
    switch (shape.kind) {
      case "rect":
        return shape.width > 2 && shape.height > 2;
      case "ellipse":
        return shape.rx > 1 && shape.ry > 1;
      case "line":
        return Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1) > 2;
      case "path":
        return shape.points.length > 1;
    }
  };

  const onSurfaceDown = (
    event: PointerEvent & { currentTarget: SVGSVGElement },
  ) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const p = at(event);
    origin = p;

    if (tool.peek() === "select") {
      select(null);
      return;
    }

    draft.set(startDraft(p));
  };

  const onSurfaceMove = (event: PointerEvent) => {
    const p = at(event);
    cursor.set(p);

    if (drag) {
      if (!drag.moved) {
        // снимок пишем на первом реальном сдвиге, а не на каждом клике
        history.record("перемещение");
        drag.moved = true;
      }
      const moved = translate(drag.base, p.x - drag.from.x, p.y - drag.from.y);
      patchShape(drag.id, moved);
      return;
    }

    const current = draft.peek();
    if (current) {
      draft.set(growDraft(current, p));
    }
  };

  const onSurfaceUp = () => {
    const current = draft.peek();
    origin = null;
    drag = null;

    if (!current) {
      return;
    }

    draft.set(null);

    if (meaningful(current)) {
      history.record("рисование");
      addShape({
        ...current,
        name: `${current.name} ${shapes.peek().length + 1}`,
      });
    }
  };

  const onShapeDown = (event: PointerEvent, shape: Shape) => {
    const active = tool.peek();

    if (active === "eraser") {
      event.stopPropagation();
      history.record("ластик");
      removeShape(shape.id);
      return;
    }

    if (active !== "select") {
      return; // другими инструментами рисуем прямо поверх фигуры
    }

    event.stopPropagation();
    // события до отпускания забирает холст: увести курсор за его край можно,
    // потерять при этом фигуру — нет
    surface?.setPointerCapture?.(event.pointerId);
    select(shape.id);
    drag = { id: shape.id, from: at(event), base: shape, moved: false };
  };

  return () => (
    <div class="canvas">
      <svg
        class={() => `canvas__surface canvas__surface--${tool.value}`}
        ref={(el) => (surface = el)}
        onPointerdown={onSurfaceDown}
        onPointermove={onSurfaceMove}
        onPointerup={onSurfaceUp}
        onPointercancel={onSurfaceUp}
        onContextmenu:prevent={() => select(null)}
      >
        <defs>
          <pattern
            id="paint-grid"
            patternUnits="userSpaceOnUse"
            width={() => brush.gridStep}
            height={() => brush.gridStep}
          >
            <path
              class="grid__line"
              d={() => `M ${brush.gridStep} 0 L 0 0 0 ${brush.gridStep}`}
              fill="none"
            />
          </pattern>
        </defs>

        {() =>
          brush.grid ? (
            <rect
              class="grid"
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#paint-grid)"
            />
          ) : null
        }

        <For each={() => shapes.value} by={(shape: Shape) => shape.id}>
          {(shape) => () => shapeNode(shape.value, onShapeDown)}
        </For>

        {() => {
          const current = draft.value;
          return current ? shapeNode(current) : null;
        }}

        {() => {
          const box = selectedBounds.value;
          if (!box || !selectedId.value) {
            return null;
          }
          return (
            <rect
              class="selection"
              x={box.x - 6}
              y={box.y - 6}
              width={box.width + 12}
              height={box.height + 12}
              fill="none"
            />
          );
        }}
      </svg>

      <div class="canvas__hud">
        <span>
          {() =>
            `${Math.round(cursor.value.x)} × ${Math.round(cursor.value.y)}`
          }
        </span>
        <span>{() => tool.get((t) => TOOL_HINT[t])}</span>
      </div>
    </div>
  );
};

const TOOL_HINT: Record<string, string> = {
  select: "тащите фигуру, ПКМ — снять выделение",
  rect: "потяните — прямоугольник",
  ellipse: "потяните — эллипс",
  line: "потяните — линия",
  pen: "рисуйте от руки",
  eraser: "клик по фигуре — удалить",
};
