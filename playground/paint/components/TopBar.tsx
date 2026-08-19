import { defineOptions, requirePlugin } from "orve";
import { clearDocument, shapes, stats } from "../store/document.js";
import { useTheme } from "../theme.js";

/** Выгрузка холста в файл — сериализуем то, что реально стоит в DOM. */
function exportSvg() {
  const node = document.querySelector(".canvas__surface");
  if (!node) {
    return;
  }

  const copy = node.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.querySelectorAll(".grid, .selection").forEach((el) => el.remove());

  const blob = new Blob([new XMLSerializer().serializeToString(copy)], {
    type: "image/svg+xml",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "orve-paint.svg";
  link.click();
  URL.revokeObjectURL(url);
}

export const TopBar = () => {
  defineOptions({ single: true });

  const history = requirePlugin("$history");
  const theme = useTheme();

  const wipe = () => {
    if (shapes.peek().length === 0) {
      return;
    }
    history.record("очистка холста");
    clearDocument();
  };

  return () => (
    <header class="topbar">
      <div class="topbar__brand">
        <span class="topbar__logo">◐</span>
        <div>
          <strong>Orve Paint</strong>
          <span class="topbar__sub">
            {() =>
              `${stats.value.total} фигур · ${stats.value.visible} видимых`
            }
          </span>
        </div>
      </div>

      <div class="topbar__actions">
        <button type="button" class="ghost" onClick={() => theme.toggle()}>
          {() => theme.name.get((v) => (v === "night" ? "☾ Ночь" : "☀ День"))}
        </button>
        <button type="button" class="ghost" onClick={exportSvg}>
          ⤓ SVG
        </button>
        <button type="button" class="ghost ghost--danger" onClick={wipe}>
          ␡ Очистить
        </button>
      </div>
    </header>
  );
};
