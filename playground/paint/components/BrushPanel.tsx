import { brush, tool } from "../store/document.js";
import { useTheme } from "../theme.js";
import { ColorField, Panel, Slider, Switch } from "./ui.js";

const TOOL_NAME: Record<string, string> = {
  select: "Выбор",
  rect: "Прямоугольник",
  ellipse: "Эллипс",
  line: "Линия",
  pen: "Кисть",
  eraser: "Ластик",
};

const ACCENTS = ["#7c5cff", "#ff5c8a", "#25d0a0", "#f6d365", "#4cc9f0"];

/**
 * Кисть и холст. Настройки лежат в `reactive()`: подписка идёт по ключам,
 * поэтому запись `brush.grid = false` дёргает только тех, кто читал `grid`.
 */
export const BrushPanel = () => {
  const theme = useTheme();

  return () => (
    <Panel title="Кисть" hint={tool.get((t) => TOOL_NAME[t])}>
      <ColorField
        label="Заливка"
        value={brush.fill}
        onPick={(v) => (brush.fill = v)}
      />
      <ColorField
        label="Обводка"
        value={brush.stroke}
        onPick={(v) => (brush.stroke = v)}
      />

      <Slider
        label="Толщина"
        value={brush.strokeWidth}
        min={1}
        max={40}
        suffix=" px"
        onPick={(v) => (brush.strokeWidth = v)}
      />

      <Slider
        label="Прозрачность"
        value={Math.round(brush.opacity * 100)}
        min={10}
        max={100}
        suffix=" %"
        onPick={(v) => (brush.opacity = v / 100)}
      />

      <div class="divider" />

      <Switch
        label="Сетка"
        value={brush.grid}
        onPick={(v) => (brush.grid = v)}
      />
      <Switch
        label="Прилипание к сетке"
        value={brush.snap}
        onPick={(v) => (brush.snap = v)}
      />

      <Slider
        label="Шаг сетки"
        value={brush.gridStep}
        min={8}
        max={64}
        step={4}
        suffix=" px"
        onPick={(v) => (brush.gridStep = v)}
      />

      <div class="divider" />

      <span class="field__label">Акцент интерфейса</span>
      <div class="swatches">
        {ACCENTS.map((color) => (
          <button
            type="button"
            class={{ swatch: true, "is-active": theme.accent.value === color }}
            style={{ background: color }}
            title={color}
            onClick={() => theme.accent.set(color)}
          />
        ))}
      </div>
    </Panel>
  );
};
