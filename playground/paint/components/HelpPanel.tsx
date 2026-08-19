import { requirePlugin } from "orve";
import { Panel } from "./ui.js";

/**
 * Справка и лента истории. Базовый режим: список перерисовывается целиком
 * на каждое изменение — для короткой ленты это дешевле любых тонков.
 */
export const HelpPanel = () => {
  const history = requirePlugin("$history");
  const shortcuts = requirePlugin("$shortcuts");

  return () => (
    <Panel title="Справка" hint="плагины $history и $shortcuts">
      <ul class="keys">
        {shortcuts.bindings.map((binding) => (
          <li>
            <kbd>{binding.keys}</kbd>
            <span>{binding.label}</span>
          </li>
        ))}
      </ul>

      <div class="divider" />

      <span class="field__label">История</span>
      {history.labels.value.length === 0 ? (
        <p class="empty">Пока ничего не менялось.</p>
      ) : (
        <ol class="timeline">
          {history.labels.value.map((label, index) => (
            <li class={{ "is-head": index === 0 }}>{label}</li>
          ))}
        </ol>
      )}

      <div class="row">
        <button
          type="button"
          class="ghost"
          disabled={!history.canUndo.value}
          onClick={() => history.undo()}
        >
          ↶ Отменить
        </button>
        <button
          type="button"
          class="ghost"
          disabled={!history.canRedo.value}
          onClick={() => history.redo()}
        >
          ↷ Повторить
        </button>
      </div>
    </Panel>
  );
};
