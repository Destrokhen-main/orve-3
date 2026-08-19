import { computed, reactive, state, untrack, watch } from "orve";
import type { Shape, Tool } from "../types.js";
import { bounds } from "./geometry.js";

const STORAGE_KEY = "orve-paint:doc";

let seq = 0;
export const nextId = (kind: string) => `${kind}-${++seq}-${Date.now() % 1e5}`;

/* ───────────────────────────── состояние ───────────────────────────── */

/**
 * Список фигур — обычный `state` с иммутабельными обновлениями: `For` держит
 * строки по `by`, а замена объекта элемента и есть сигнал «эта строка поменялась».
 */
export const shapes = state<Shape[]>(restore() ?? seed());

export const selectedId = state<string | null>(null);

/** Инструмент отдельным сигналом — ниже показан `state.get(fn)` на нём. */
export const tool = state<Tool>("select");

/**
 * Настройки кисти и холста — глубокий `reactive`: подписка идёт по ключам,
 * поэтому `brush.fill = "#fff"` дёргает только тех, кто читал `fill`.
 */
export const brush = reactive({
  fill: "#7c5cff",
  stroke: "#101018",
  strokeWidth: 3,
  opacity: 1,
  grid: true,
  snap: false,
  gridStep: 16,
});

/** Позиция курсора на холсте — для строки состояния. */
export const cursor = state({ x: 0, y: 0 });

/* ───────────────────────────── производные ───────────────────────────── */

export const selected = computed<Shape | null>(
  () => shapes.value.find((s) => s.id === selectedId.value) ?? null,
);

export const selectedBounds = computed(() => {
  const shape = selected.value;
  return shape ? bounds(shape) : null;
});

export const stats = computed(() => {
  const list = shapes.value;
  return {
    total: list.length,
    visible: list.filter((s) => s.visible).length,
    kinds: list.reduce<Record<string, number>>((acc, s) => {
      acc[s.kind] = (acc[s.kind] ?? 0) + 1;
      return acc;
    }, {}),
  };
});

/* ───────────────────────────── операции ───────────────────────────── */

export function setShapes(next: Shape[]) {
  shapes.set(next);
  if (selectedId.value && !next.some((s) => s.id === selectedId.value)) {
    selectedId.set(null);
  }
}

export function addShape(shape: Shape) {
  shapes.set((list) => [...list, shape]);
  selectedId.set(shape.id);
}

export function patchShape(id: string, patch: Partial<Shape>) {
  shapes.set((list) =>
    list.map((s) => (s.id === id ? ({ ...s, ...patch } as Shape) : s)),
  );
}

export function removeShape(id: string) {
  shapes.set((list) => list.filter((s) => s.id !== id));
  if (selectedId.value === id) {
    selectedId.set(null);
  }
}

export function duplicateShape(id: string) {
  const source = untrack(() => shapes.value.find((s) => s.id === id));
  if (!source) {
    return;
  }

  const copy = {
    ...source,
    id: nextId(source.kind),
    name: `${source.name} копия`,
  } as Shape;

  shapes.set((list) => [...list, copy]);
  selectedId.set(copy.id);
}

/** Порядок в списке — он же порядок отрисовки: последний рисуется поверх. */
export function reorderShape(id: string, direction: -1 | 1) {
  shapes.set((list) => {
    const index = list.findIndex((s) => s.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= list.length) {
      return list;
    }

    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
}

export function clearDocument() {
  shapes.set([]);
  selectedId.set(null);
}

export function select(id: string | null) {
  selectedId.set(id);
}

/* ───────────────────────────── хранилище ───────────────────────────── */

function restore(): Shape[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Shape[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Автосохранение: `watch` смотрит ровно на список фигур и ничего больше. */
watch(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes.peek()));
  } catch {
    /* приватный режим — просто не сохраняем */
  }
}, [shapes]);

function seed(): Shape[] {
  return [
    {
      id: nextId("rect"),
      kind: "rect",
      name: "Фон",
      visible: true,
      fill: "#1b1b2b",
      stroke: "#2f2f47",
      strokeWidth: 2,
      opacity: 1,
      x: 80,
      y: 70,
      width: 420,
      height: 260,
    },
    {
      id: nextId("ellipse"),
      kind: "ellipse",
      name: "Луна",
      visible: true,
      fill: "#f6d365",
      stroke: "#00000000",
      strokeWidth: 0,
      opacity: 1,
      cx: 400,
      cy: 150,
      rx: 46,
      ry: 46,
    },
    {
      id: nextId("path"),
      kind: "path",
      name: "Горизонт",
      visible: true,
      fill: "transparent",
      stroke: "#7c5cff",
      strokeWidth: 6,
      opacity: 1,
      points: [
        { x: 90, y: 300 },
        { x: 170, y: 240 },
        { x: 240, y: 285 },
        { x: 320, y: 205 },
        { x: 400, y: 270 },
        { x: 490, y: 225 },
      ],
    },
  ];
}
