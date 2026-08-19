import { createInstance } from "orve";
import { App } from "./components/App.js";
import { historyPlugin } from "./plugins/history.js";
import { shortcutsPlugin } from "./plugins/shortcuts.js";

/**
 * Порядок `use()` значим: горячие клавиши строятся поверх истории и
 * проверяют её наличие через `api.has("$history")`.
 */
createInstance()
  .use(historyPlugin)
  .use(shortcutsPlugin)
  .rootComponent(App)
  .mountRoot("#app");
