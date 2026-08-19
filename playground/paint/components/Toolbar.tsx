import { computed, defineOptions, requirePlugin } from "orve";
import { tool } from "../store/document.js";
import type { Tool } from "../types.js";
import { ToolButton } from "./ui.js";

const TOOLS: { id: Tool; icon: string; label: string; hint: string }[] = [
  { id: "select", icon: "⬚", label: "Выбор", hint: "Выбор и перенос — V" },
  { id: "rect", icon: "▭", label: "Прямо­угольник", hint: "Прямоугольник — R" },
  { id: "ellipse", icon: "◯", label: "Эллипс", hint: "Эллипс — E" },
  { id: "line", icon: "╱", label: "Линия", hint: "Линия — L" },
  { id: "pen", icon: "✎", label: "Кисть", hint: "Свободная кривая — P" },
  { id: "eraser", icon: "⌫", label: "Ластик", hint: "Удалить фигуру — X" },
];

/**
 * Левая панель инструментов.
 *
 * Сингл: render проходит один раз, кнопки строятся обычным `map`. Живым
 * остаётся только проп `active` — он уезжает вниз `computed`'ом, и базовая
 * кнопка перерисовывается сама, без участия панели.
 */
export const Toolbar = () => {
  defineOptions({ single: true });

  const history = requirePlugin("$history");

  return () => (
    <aside class="rail">
      <div class="rail__group">
        {TOOLS.map((item) => (
          <ToolButton
            icon={item.icon}
            label={item.label}
            hint={item.hint}
            active={computed(() => tool.value === item.id)}
            onPick={() => tool.set(item.id)}
          />
        ))}
      </div>

      <div class="rail__group rail__group--history">
        <button
          type="button"
          class="ghost"
          title="Отменить — Ctrl+Z"
          disabled={() => !history.canUndo.value}
          onClick={() => history.undo()}
        >
          ↶
        </button>
        <button
          type="button"
          class="ghost"
          title="Повторить — Ctrl+Shift+Z"
          disabled={() => !history.canRedo.value}
          onClick={() => history.redo()}
        >
          ↷
        </button>
      </div>
    </aside>
  );
};
