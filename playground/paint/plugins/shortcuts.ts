import type { OrvePluginType } from "orve";
import {
  brush,
  duplicateShape,
  removeShape,
  select,
  selectedId,
  tool,
} from "../store/document.js";
import type { Tool } from "../types.js";

export type Binding = { keys: string; label: string };

export type ShortcutsApi = {
  readonly bindings: Binding[];
};

const TOOLS: Record<string, Tool> = {
  v: "select",
  r: "rect",
  e: "ellipse",
  l: "line",
  p: "pen",
  x: "eraser",
};

const BINDINGS: Binding[] = [
  { keys: "V R E L P X", label: "инструменты" },
  { keys: "Ctrl+Z", label: "отменить" },
  { keys: "Ctrl+Shift+Z", label: "повторить" },
  { keys: "Ctrl+D", label: "дублировать" },
  { keys: "Delete", label: "удалить фигуру" },
  { keys: "G / S", label: "сетка / прилипание" },
  { keys: "Esc", label: "снять выделение" },
];

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable);

/**
 * Горячие клавиши. Ставится вторым — и через `api.has` проверяет,
 * что история уже в контексте: порядок `use()` тут значимый.
 */
export const shortcutsPlugin: OrvePluginType = {
  name: "$shortcuts",

  setup(cx, api) {
    if (!api.has("$history")) {
      console.warn("[paint] $shortcuts ставится после $history");
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;

      if (mod && key === "z") {
        event.preventDefault();
        event.shiftKey ? cx.$history.redo() : cx.$history.undo();
        return;
      }

      if (mod && key === "y") {
        event.preventDefault();
        cx.$history.redo();
        return;
      }

      if (mod && key === "d") {
        event.preventDefault();
        if (selectedId.peek()) {
          cx.$history.record("дублирование");
          duplicateShape(selectedId.peek()!);
        }
        return;
      }

      if (key === "delete" || key === "backspace") {
        const id = selectedId.peek();
        if (id) {
          event.preventDefault();
          cx.$history.record("удаление");
          removeShape(id);
        }
        return;
      }

      if (key === "escape") {
        select(null);
        return;
      }

      if (key === "g") {
        brush.grid = !brush.grid;
        return;
      }

      if (key === "s") {
        brush.snap = !brush.snap;
        return;
      }

      if (TOOLS[key]) {
        tool.set(TOOLS[key]);
      }
    };

    api.provide("$shortcuts", { bindings: BINDINGS });
    window.addEventListener("keydown", onKeyDown);

    // возврат из setup — это и есть onUnmounted, только короче
    return () => window.removeEventListener("keydown", onKeyDown);
  },
};

declare module "orve" {
  interface OrvePlugins {
    $shortcuts: ShortcutsApi;
  }
}
