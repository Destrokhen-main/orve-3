import { cursor, selected, stats, tool } from "../store/document.js";

const TOOL_NAME: Record<string, string> = {
  select: "выбор",
  rect: "прямоугольник",
  ellipse: "эллипс",
  line: "линия",
  pen: "кисть",
  eraser: "ластик",
};

/**
 * Строка состояния — базовый компонент: перерисовывается целиком, зато
 * читается как обычный шаблон. Всё, что здесь есть, — производные `computed`.
 */
export const StatusBar = () => {
  return () => (
    <footer class="status">
      <span>
        Инструмент: <b>{tool.get((t) => TOOL_NAME[t])}</b>
      </span>
      <span>
        Фигур: <b>{stats.value.total}</b>
      </span>
      <span>
        {Object.entries(stats.value.kinds)
          .map(([kind, count]) => `${kind}: ${count}`)
          .join(" · ") || "холст пуст"}
      </span>
      <span class="status__spacer" />
      <span>
        {selected.value
          ? `Выбрано: ${selected.value.name}`
          : "Ничего не выбрано"}
      </span>
      <span class="status__cursor">
        {Math.round(cursor.value.x)} : {Math.round(cursor.value.y)}
      </span>
    </footer>
  );
};
