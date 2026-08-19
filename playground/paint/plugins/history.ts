import { computed, state, type Computed, type OrvePluginType } from "orve";
import { shapes, setShapes } from "../store/document.js";
import type { Shape } from "../types.js";

type Entry = { label: string; snapshot: Shape[] };

export type HistoryApi = {
  /** Снимок «до» изменения — вызывается перед каждой правкой документа. */
  record(label: string): void;
  undo(): void;
  redo(): void;
  clear(): void;
  readonly canUndo: Computed<boolean>;
  readonly canRedo: Computed<boolean>;
  /** Подписи шагов, сверху — последний. */
  readonly labels: Computed<string[]>;
};

const LIMIT = 60;

/**
 * История правок — плагин, а не `provide`: она нужна и компонентам,
 * и глобальным горячим клавишам, которые к дереву не привязаны.
 */
export const historyPlugin: OrvePluginType = {
  name: "$history",

  setup(cx, api) {
    const past = state<Entry[]>([]);
    const future = state<Entry[]>([]);

    const snapshot = (label: string): Entry => ({
      label,
      snapshot: shapes.peek().map((s) => ({ ...s })),
    });

    const history: HistoryApi = {
      record(label) {
        past.set((list) => [...list, snapshot(label)].slice(-LIMIT));
        if (future.peek().length > 0) {
          future.set([]);
        }
      },

      undo() {
        const list = past.peek();
        const entry = list[list.length - 1];
        if (!entry) {
          return;
        }

        past.set(list.slice(0, -1));
        future.set((next) => [snapshot(entry.label), ...next]);
        setShapes(entry.snapshot);
      },

      redo() {
        const [entry, ...rest] = future.peek();
        if (!entry) {
          return;
        }

        future.set(rest);
        past.set((list) => [...list, snapshot(entry.label)]);
        setShapes(entry.snapshot);
      },

      clear() {
        past.set([]);
        future.set([]);
      },

      canUndo: computed(() => past.value.length > 0),
      canRedo: computed(() => future.value.length > 0),
      labels: computed(() =>
        past.value
          .map((entry) => entry.label)
          .slice(-8)
          .reverse(),
      ),
    };

    api.provide("$history", history);

    // область эффектов у плагина своя: computed'ы гасим руками
    return () => {
      history.canUndo.stop();
      history.canRedo.stop();
      history.labels.stop();
    };
  },
};

declare module "orve" {
  interface OrvePlugins {
    $history: HistoryApi;
  }
}
