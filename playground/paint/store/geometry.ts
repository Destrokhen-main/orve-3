import type { Bounds, Point, Shape } from "../types.js";

/** Прямоугольник по двум углам — рисование идёт в любую сторону. */
export function normalizeRect(a: Point, b: Point): Bounds {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

/** Габариты фигуры — нужны рамке выделения и панели слоёв. */
export function bounds(shape: Shape): Bounds {
  switch (shape.kind) {
    case "rect":
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    case "ellipse":
      return {
        x: shape.cx - shape.rx,
        y: shape.cy - shape.ry,
        width: shape.rx * 2,
        height: shape.ry * 2,
      };
    case "line":
      return normalizeRect(
        { x: shape.x1, y: shape.y1 },
        { x: shape.x2, y: shape.y2 },
      );
    case "path": {
      if (shape.points.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      return {
        x,
        y,
        width: Math.max(...xs) - x,
        height: Math.max(...ys) - y,
      };
    }
  }
}

/**
 * Сдвиг фигуры — всегда копией. Мутация на месте до DOM не долетит:
 * `For` сравнивает элемент по `Object.is`, тот же объект изменением не считается.
 */
export function translate(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.kind) {
    case "rect":
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case "ellipse":
      return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
    case "line":
      return {
        ...shape,
        x1: shape.x1 + dx,
        y1: shape.y1 + dy,
        x2: shape.x2 + dx,
        y2: shape.y2 + dy,
      };
    case "path":
      return {
        ...shape,
        points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };
  }
}

/** Кривая от руки: полилиния, сглаженная серединами отрезков. */
export function pathD(points: Point[]): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length < 3) {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
      .join(" ");
  }

  const parts = [`M${points[0].x} ${points[0].y}`];

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const next = points[i + 1];
    const mx = (p.x + next.x) / 2;
    const my = (p.y + next.y) / 2;
    parts.push(`Q${p.x} ${p.y} ${mx} ${my}`);
  }

  const last = points[points.length - 1];
  parts.push(`L${last.x} ${last.y}`);

  return parts.join(" ");
}

/** Округление к сетке — включается тумблером «прилипание». */
export function snapTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}
