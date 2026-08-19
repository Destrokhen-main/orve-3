/** Модель документа редактора: плоский список фигур поверх SVG-холста. */

export type Point = { x: number; y: number };

export type Tool = "select" | "rect" | "ellipse" | "line" | "pen" | "eraser";

export type ShapeKind = "rect" | "ellipse" | "line" | "path";

type Common<K extends ShapeKind> = {
  id: string;
  kind: K;
  name: string;
  visible: boolean;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
};

export type RectShape = Common<"rect"> & {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EllipseShape = Common<"ellipse"> & {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export type LineShape = Common<"line"> & {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type PathShape = Common<"path"> & {
  points: Point[];
};

export type Shape = RectShape | EllipseShape | LineShape | PathShape;

export type Bounds = { x: number; y: number; width: number; height: number };
