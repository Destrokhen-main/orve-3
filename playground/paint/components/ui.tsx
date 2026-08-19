import { forwardProps, type Child, type Props } from "orve";

/**
 * Каркас боковой панели.
 *
 * Всё, что не перечислено в `skip`, уезжает на `<section>` как есть —
 * ровно тот случай, ради которого существует `forwardProps`. Вызов стоит
 * внутри render: в `setup` копия снялась бы один раз и застыла.
 */
export const Panel = (props: Props) => {
  return () => {
    const rest = forwardProps(props, ["title", "hint", "children"]);

    return (
      <section {...rest} class="panel">
        <header class="panel__head">
          <h2 class="panel__title">{props.title as string}</h2>
          {props.hint ? (
            <span class="panel__hint">{props.hint as string}</span>
          ) : null}
        </header>
        <div class="panel__body">{props.children as Child}</div>
      </section>
    );
  };
};

/** Кнопка инструмента: иконка сверху, подпись снизу. */
export const ToolButton = (props: {
  icon: string;
  label: string;
  hint?: string;
  active?: boolean;
  onPick: () => void;
}) => {
  return () => (
    <button
      type="button"
      class={{ tool: true, "is-active": Boolean(props.active) }}
      title={props.hint ?? props.label}
      onClick={() => props.onPick()}
    >
      <span class="tool__icon" aria-hidden="true">
        {props.icon}
      </span>
      <span class="tool__label">{props.label}</span>
    </button>
  );
};

/** Ползунок с числом. Значение приходит вниз, изменение уходит наверх. */
export const Slider = (props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  /** Вызывается перед первым изменением — сюда вешается снимок истории. */
  onStart?: () => void;
  onPick: (value: number) => void;
}) => {
  return () => (
    <label class="field">
      <span class="field__label">
        {props.label}
        <b class="field__value">
          {props.value}
          {props.suffix ?? ""}
        </b>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={String(props.value)}
        onPointerdown={() => props.onStart?.()}
        onInput={(e) => props.onPick(Number(e.currentTarget.value))}
      />
    </label>
  );
};

/** Цвет: нативная пипетка плюс поле для hex. */
export const ColorField = (props: {
  label: string;
  value: string;
  onStart?: () => void;
  onPick: (value: string) => void;
}) => {
  return () => (
    <label class="field field--color">
      <span class="field__label">{props.label}</span>
      <span class="color">
        <input
          type="color"
          value={
            props.value.startsWith("#") ? props.value.slice(0, 7) : "#000000"
          }
          onPointerdown={() => props.onStart?.()}
          onInput={(e) => props.onPick(e.currentTarget.value)}
        />
        <input
          class="color__hex"
          value={props.value}
          spellcheck={false}
          onChange={(e) => props.onPick(e.currentTarget.value.trim())}
        />
      </span>
    </label>
  );
};

/** Тумблер. */
export const Switch = (props: {
  label: string;
  value: boolean;
  onPick: (value: boolean) => void;
}) => {
  return () => (
    <label class={{ switch: true, "is-on": props.value }}>
      <input
        type="checkbox"
        checked={props.value}
        onChange={(e) => props.onPick(e.currentTarget.checked)}
      />
      <span class="switch__track">
        <span class="switch__dot" />
      </span>
      <span class="switch__label">{props.label}</span>
    </label>
  );
};
