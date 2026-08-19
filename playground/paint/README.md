# Orve Paint

Векторный мини-редактор на Orve: SVG-холст, слои, история правок, горячие
клавиши. Пример собран так, чтобы каждая заметная возможность фреймворка была
видна в работе, а не только в документации.

```bash
pnpm dev            # затем открыть http://localhost:5273/paint/
npx jest playground/paint   # смоук: монтирование, рисование, отмена, вкладки
```

## Что где показано

| Возможность                                                         | Файл                                                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `state`, иммутабельные обновления списка                            | [store/document.ts](store/document.ts)                                                                 |
| `computed` — выделение, габариты, статистика                        | [store/document.ts](store/document.ts)                                                                 |
| `reactive()` — настройки кисти, подписка по ключам                  | [store/document.ts](store/document.ts), [components/BrushPanel.tsx](components/BrushPanel.tsx)         |
| `watch` — автосохранение и заголовок вкладки                        | [store/document.ts](store/document.ts), [components/App.tsx](components/App.tsx)                       |
| `state.get(fn)` — преобразование в точке чтения                     | [components/StatusBar.tsx](components/StatusBar.tsx), [components/Canvas.tsx](components/Canvas.tsx)   |
| Сингл-режим (`defineOptions({ single: true })`)                     | `App`, `Canvas`, `Toolbar`, `TopBar`, `LayerPanel`                                                     |
| Базовый режим — форма перерисовывается целиком                      | `Inspector`, `BrushPanel`, `HelpPanel`, `StatusBar`, `ui.tsx`                                          |
| Стык режимов: сингл-родитель → базовый ребёнок с `computed` в пропе | [components/Toolbar.tsx](components/Toolbar.tsx)                                                       |
| `<For>` с `by` и сигналами на строку                                | [components/LayerPanel.tsx](components/LayerPanel.tsx)                                                 |
| `<If>` — пустой холст                                               | [components/LayerPanel.tsx](components/LayerPanel.tsx)                                                 |
| `<Component is={computed}>` — вкладки правой колонки                | [components/App.tsx](components/App.tsx)                                                               |
| `forwardProps` внутри render                                        | [components/ui.tsx](components/ui.tsx)                                                                 |
| Плагины: порядок, `api.has`, cleanup из `setup`, типизация          | [plugins/history.ts](plugins/history.ts), [plugins/shortcuts.ts](plugins/shortcuts.ts)                 |
| `provide` / `inject` — тема и акцент                                | [theme.ts](theme.ts)                                                                                   |
| Хуки жизненного цикла                                               | [components/App.tsx](components/App.tsx)                                                               |
| SVG-пространство имён, реактивные атрибуты-тонки                    | [components/Canvas.tsx](components/Canvas.tsx)                                                         |
| `ref`, приписки событий (`onClick:stop`, `onContextmenu:prevent`)   | [components/Canvas.tsx](components/Canvas.tsx), [components/LayerPanel.tsx](components/LayerPanel.tsx) |
| Объектные `class` и `style`                                         | [components/LayerPanel.tsx](components/LayerPanel.tsx)                                                 |

## Две вещи, о которые легко споткнуться

1. **Пропсы не разбираются.** Везде только `props.x` — тело компонента это
   `setup`, оно выполняется один раз, и `const { x } = props` заморозило бы
   значение навсегда.
2. **Имена событий пишутся как в DOM-карте**: `onPointerdown`,
   `onContextmenu` — типы собираются из `Capitalize<"pointerdown">`, а рантайм
   всё равно приводит имя к нижнему регистру.

## Горячие клавиши

`V R E L P X` — инструменты, `Ctrl+Z` / `Ctrl+Shift+Z` — отмена и повтор,
`Ctrl+D` — дублировать, `Delete` — удалить, `G` / `S` — сетка и прилипание,
`Esc` — снять выделение.
