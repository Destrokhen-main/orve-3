import { inject, provide, state, type State } from "orve";

export type ThemeName = "night" | "day";

export type ThemeApi = {
  name: State<ThemeName>;
  accent: State<string>;
  toggle(): void;
};

const THEME_KEY = Symbol("paint:theme");

/** Вызывается в `setup` корня: тема уезжает вниз по дереву без пропсов. */
// Это пример, можно сделать как плагином, так и вот таким способом
export function provideTheme(): ThemeApi {
  const name = state<ThemeName>("night");
  const accent = state("#7c5cff");

  const theme: ThemeApi = {
    name,
    accent,
    toggle: () => name.set((v) => (v === "night" ? "day" : "night")),
  };

  provide(THEME_KEY, theme);
  return theme;
}

/** Только в `setup` потомка — как и сам `inject`. */
export function useTheme(): ThemeApi {
  const theme = inject<ThemeApi>(THEME_KEY);

  if (!theme) {
    throw new Error("[paint] useTheme вызван вне <App/>");
  }

  return theme;
}
