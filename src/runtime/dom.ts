import { MATHML_URI, NS, SVG_URI } from "./namespace.js";

/** Пропы, которые обязаны идти в DOM-свойство: атрибут задаёт лишь начальное значение. */
const DOM_PROPS = new Set([
  "value",
  "checked",
  "selected",
  "muted",
  "volume",
  "playbackRate",
  "srcObject",
  "innerHTML",
  "textContent",
]);

/** Атрибуты-флаги: важно наличие, а не значение. */
const BOOLEAN_ATTRS = new Set([
  "allowfullscreen",
  "autofocus",
  "autoplay",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
]);

/** JSX-имена, у которых в DOM другое название атрибута. */
const ATTR_ALIAS: Record<string, string> = {
  className: "class",
  htmlFor: "for",
  readOnly: "readonly",
  tabIndex: "tabindex",
};

export function createEl(tag: string, ns: NS): Element {
  if (ns === "svg") {
    return document.createElementNS(SVG_URI, tag);
  }
  if (ns === "mathml") {
    return document.createElementNS(MATHML_URI, tag);
  }
  return document.createElement(tag);
}

/** `onClick`, `onInput` — обработчики. Никогда не тонки, даже будучи функциями. */
export function isEventProp(key: string) {
  return (
    key.length > 2 && key.startsWith("on") && key[2] === key[2].toUpperCase()
  );
}

export function isInternalProp(key: string) {
  return key === "children" || key === "key" || key === "ref";
}

/** `onClickCapture` → событие `click` в фазе перехвата. */
export function parseEvent(key: string) {
  const capture = key.endsWith("Capture");
  const name = (capture ? key.slice(2, -7) : key.slice(2)).toLowerCase();
  return { name, capture };
}

export type EventValue =
  | EventListener
  | [EventListener, AddEventListenerOptions | boolean];

export function addListener(el: Element, key: string, value: EventValue) {
  const { name, capture } = parseEvent(key);
  const [handler, options] = Array.isArray(value) ? value : [value, undefined];
  el.addEventListener(name, handler, options ?? capture);
}

export function removeListener(el: Element, key: string, value: EventValue) {
  const { name, capture } = parseEvent(key);
  const [handler, options] = Array.isArray(value) ? value : [value, undefined];
  el.removeEventListener(name, handler, options ?? capture);
}

/** `"a"` | `["a", false && "b"]` | `{ a: true, b: false }` → `"a"` */
export function normalizeClass(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeClass).filter(Boolean).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .filter((key) => (value as Record<string, unknown>)[key])
      .join(" ");
  }

  return "";
}

const hyphenate = (key: string) =>
  key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function applyStyle(el: Element, next: unknown, prev: unknown) {
  if (typeof next === "string") {
    el.setAttribute("style", next);
    return;
  }

  if (next === null || next === undefined) {
    el.removeAttribute("style");
    return;
  }

  const style = (el as HTMLElement).style;
  const nextStyle = next as Record<string, unknown>;

  // свойства, которых больше нет, надо снять поимённо
  if (prev && typeof prev === "object") {
    for (const key of Object.keys(prev as Record<string, unknown>)) {
      if (!(key in nextStyle)) {
        style.removeProperty(hyphenate(key));
      }
    }
  }

  for (const key of Object.keys(nextStyle)) {
    const value = nextStyle[key];
    const name = key.startsWith("--") ? key : hyphenate(key);

    if (value === null || value === undefined || value === false) {
      style.removeProperty(name);
    } else {
      style.setProperty(name, String(value));
    }
  }
}

/**
 * Единственное место, где решается «свойство или атрибут».
 * В SVG/MathML свойств нет — там всегда атрибуты.
 */
export function applyProp(
  el: Element,
  key: string,
  next: unknown,
  prev: unknown = undefined,
  ns: NS = "html",
) {
  if (isInternalProp(key)) {
    return;
  }

  if (key === "style") {
    applyStyle(el, next, prev);
    return;
  }

  if (key === "class" || key === "className") {
    const value = normalizeClass(next);
    if (value === "") {
      el.removeAttribute("class");
    } else {
      el.setAttribute("class", value);
    }
    return;
  }

  if (ns === "html" && DOM_PROPS.has(key) && key in el) {
    const target = el as unknown as Record<string, unknown>;

    if (key === "value") {
      // не трогаем поле, если пользователь уже ввёл ровно это
      const text = next === null || next === undefined ? "" : String(next);
      if (target.value !== text) {
        target.value = text;
      }
      return;
    }

    target[key] = next === undefined ? null : next;
    return;
  }

  const name = ATTR_ALIAS[key] ?? key;

  if (next === null || next === undefined || next === false) {
    el.removeAttribute(name);
    return;
  }

  if (next === true) {
    el.setAttribute(name, BOOLEAN_ATTRS.has(name.toLowerCase()) ? "" : "true");
    return;
  }

  el.setAttribute(name, String(next));
}

/** `ref={fn}` или `ref={signal}` — доступ к живому DOM-узлу. */
export function applyRef(ref: unknown, el: Element | null) {
  if (typeof ref === "function") {
    (ref as (el: Element | null) => void)(el);
    return;
  }

  if (ref && typeof ref === "object" && "set" in ref) {
    (ref as { set: (el: Element | null) => void }).set(el);
  }
}
