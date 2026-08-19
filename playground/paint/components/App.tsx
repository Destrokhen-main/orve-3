import {
  Component,
  computed,
  defineOptions,
  onMounted,
  onUnmounted,
  state,
  watch,
  type ComponentFn,
} from "orve";
import { selected } from "../store/document.js";
import { provideTheme } from "../theme.js";
import { BrushPanel } from "./BrushPanel.js";
import { Canvas } from "./Canvas.js";
import { HelpPanel } from "./HelpPanel.js";
import { Inspector } from "./Inspector.js";
import { LayerPanel } from "./LayerPanel.js";
import { StatusBar } from "./StatusBar.js";
import { Toolbar } from "./Toolbar.js";
import { TopBar } from "./TopBar.js";

type Tab = { id: string; label: string; component: ComponentFn };

const TABS: Tab[] = [
  { id: "layers", label: "Слои", component: LayerPanel },
  { id: "shape", label: "Свойства", component: Inspector },
  { id: "brush", label: "Кисть", component: BrushPanel },
  { id: "help", label: "Справка", component: HelpPanel },
];

/**
 * Корень приложения.
 *
 * Сингл: разметка собирается один раз, дальше живут только слоты. Тема
 * раздаётся через `provide`, правая колонка переключается через `<Component>` —
 * `is` берёт компонент из `computed`, тонк там не примут: компонент сам
 * является функцией.
 */
export const App = () => {
  defineOptions({ single: true });

  const theme = provideTheme();
  const tab = state("layers");

  const panel = computed(
    () => (TABS.find((item) => item.id === tab.value) ?? TABS[0]).component,
  );

  // заголовок вкладки браузера ведём отдельным watch — это побочный эффект,
  // а не часть разметки
  const title = watch(
    (shape) => {
      document.title = shape
        ? `Orve Paint — ${(shape as { name: string }).name}`
        : "Orve Paint";
    },
    [selected],
    { immediate: true },
  );

  onMounted(() => console.info("[paint] редактор смонтирован"));
  onUnmounted(() => {
    title.un();
    panel.stop();
  });

  return () => (
    <div
      class={() => `paint paint--${theme.name.value}`}
      style={() => ({ "--accent": theme.accent.value })}
    >
      <TopBar />

      <div class="paint__body">
        <Toolbar />
        <Canvas />

        <aside class="side">
          <nav class="tabs">
            {TABS.map((item) => (
              <button
                type="button"
                class={() => ({
                  tab: true,
                  "is-active": tab.value === item.id,
                })}
                onClick={() => tab.set(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <Component is={panel} />
        </aside>
      </div>

      <StatusBar />
    </div>
  );
};
