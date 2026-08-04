import type { Child, Key } from "./types.js";

/* ─────────────────────────── служебные утилиты ─────────────────────────── */

type IfEquals<X, Y, A, B> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

/** Ключи, которые можно присвоить: readonly-поля DOM нам не интересны. */
type WritableKeys<T> = {
  [K in keyof T]-?: IfEquals<
    { [Q in K]: T[K] },
    { -readonly [Q in K]: T[K] },
    K,
    never
  >;
}[keyof T];

/** `ariaLabel` → `aria-label`. Тот же перевод, что делает `hyphenate` в dom.ts. */
type Hyphenate<S extends string> = S extends `${infer H}${infer T}`
  ? `${H extends Uppercase<H> ? (H extends Lowercase<H> ? H : `-${Lowercase<H>}`) : H}${Hyphenate<T>}`
  : S;

/** Правая часть выигрывает целиком — в отличие от пересечения, умеет расширять тип. */
type Merge<A, B> = Omit<A, keyof B> & B;

/**
 * Читаемая часть сигнала. Структурно, а не `State<T> | Computed<T>`: классы
 * инвариантны по `T`, и `State<string>` не лёг бы в проп, расширенный до
 * `string | number | null`.
 */
type Readable<T> = { readonly value: T };

/** Атрибут можно передать значением, сигналом или тонком — `bindProp` развернёт. */
type Reactive<T> = T | Readable<T> | (() => T);

type ReactiveProps<T> = { [K in keyof T]: Reactive<T[K]> };

/* ──────────────────────────────── значения ─────────────────────────────── */

/** Что вообще имеет смысл писать в атрибут. */
type AttrValue = string | number | boolean | null | undefined;

/** Понимает `normalizeClass`: строка, массив, объект-словарь. */
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, unknown>;

/**
 * camelCase-имена из `CSSStyleDeclaration` плюс кастомные свойства.
 * `applyStyle` сам переводит их в kebab-case, `--*` оставляет как есть.
 */
export type CSSProperties = {
  [K in Exclude<
    WritableKeys<CSSStyleDeclaration>,
    number | "cssText" | "cssFloat"
  > as CSSStyleDeclaration[K] extends string ? K : never]?:
    | string
    | number
    | null
    | false;
} & {
  [key: `--${string}`]: string | number | null | false | undefined;
};

/** `ref={fn}` или `ref={signal}` — оба варианта понимает `applyRef`. */
export type ElementRef<El> =
  | ((el: El | null) => void)
  | { set(el: El | null): void };

/* ──────────────────────────────── события ─────────────────────────────── */

export type EventHandler<Ev, El> = (event: Ev & { currentTarget: El }) => void;

/** Кортеж — форма с `addEventListener`-опциями: `onScroll={[fn, { passive: true }]}`. */
export type EventProp<Ev, El> =
  | EventHandler<Ev, El>
  | [EventHandler<Ev, El>, AddEventListenerOptions | boolean];

/**
 * `click` → `onClick` / `onClickCapture`. Имена совпадают с тем, что разбирает
 * `parseEvent`: он просто снимает `on`, суффикс `Capture` и опускает регистр.
 */
type EventAttributes<El, Map> = {
  [K in keyof Map & string as
    | `on${Capitalize<K>}`
    | `on${Capitalize<K>}Capture`]?: EventProp<Map[K], El>;
};

/* ─────────────────────────── атрибуты из lib.dom ───────────────────────── */

/**
 * Поля DOM-интерфейса, которые осмысленно задавать из разметки. Методы, узлы и
 * прочие объекты отсеиваются сами: у них тип не подходит под `AttrValue`.
 */
type ExcludedProps =
  | "outerHTML"
  | "innerText"
  | "outerText"
  | "nodeValue"
  | "scrollTop"
  | "scrollLeft"
  | "slot";

type DomAttributes<El> = {
  [K in WritableKeys<El> as K extends string
    ? K extends `on${string}` | `aria${string}` | ExcludedProps
      ? never
      : El[K] extends AttrValue
        ? K
        : never
    : never]?: El[K];
};

/** ARIA живёт в разметке через дефис, а не как `ariaLabel` из `ARIAMixin`. */
type AriaAttributes = {
  [K in Extract<WritableKeys<ARIAMixin>, `aria${string}`> as Hyphenate<K>]?:
    | string
    | number
    | boolean
    | null;
};

/** Того, что нет отдельным DOM-свойством. */
interface CommonAttributes {
  class?: ClassValue;
  style?: string | CSSProperties | null;
  role?: string | null;
}

type DataAttributes = {
  [key: `data-${string}`]: Reactive<AttrValue>;
};

/* ────────────────────────────── сборка тега ────────────────────────────── */

type ElementAttributes<El, Overrides, EventMap> = ReactiveProps<
  Merge<DomAttributes<El> & AriaAttributes & CommonAttributes, Overrides>
> &
  DataAttributes &
  EventAttributes<El, EventMap> & {
    ref?: ElementRef<El>;
    key?: Key;
  };

type HTMLAttributes<Tag, Overrides = object> = ElementAttributes<
  Tag extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[Tag]
    : HTMLElement,
  Overrides,
  HTMLElementEventMap
> & {
  children?: Tag extends VoidTag ? never : Child;
};

type VoidTag =
  | "area"
  | "base"
  | "br"
  | "col"
  | "embed"
  | "hr"
  | "img"
  | "input"
  | "link"
  | "meta"
  | "source"
  | "track"
  | "wbr";

/* ───────────────────── уточнения для ходовых тегов ─────────────────────── */

/**
 * `lib.dom` знает про эти поля, но типизирует их как `string` — здесь возвращаем
 * литералы и разрешаем числа там, где браузер их и так приведёт.
 */
interface Overrides {
  a: {
    href?: string;
    target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
    rel?: string;
    download?: string | boolean;
  };
  button: {
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    form?: string;
  };
  form: {
    method?: "get" | "post" | "dialog";
    enctype?:
      | "application/x-www-form-urlencoded"
      | "multipart/form-data"
      | "text/plain";
    autocomplete?: "on" | "off";
    target?: string;
  };
  img: {
    src?: string;
    width?: number | string;
    height?: number | string;
    loading?: "eager" | "lazy";
    decoding?: "sync" | "async" | "auto";
    crossorigin?: "anonymous" | "use-credentials" | "";
  };
  input: {
    type?:
      | "button"
      | "checkbox"
      | "color"
      | "date"
      | "datetime-local"
      | "email"
      | "file"
      | "hidden"
      | "image"
      | "month"
      | "number"
      | "password"
      | "radio"
      | "range"
      | "reset"
      | "search"
      | "submit"
      | "tel"
      | "text"
      | "time"
      | "url"
      | "week";
    value?: string | number | null;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    maxlength?: number;
    minlength?: number;
    size?: number;
    autocomplete?: string;
    inputmode?:
      | "none"
      | "text"
      | "decimal"
      | "numeric"
      | "tel"
      | "search"
      | "email"
      | "url";
  };
  label: { for?: string };
  ol: { start?: number; type?: "1" | "a" | "A" | "i" | "I" };
  option: { value?: string | number; selected?: boolean };
  progress: { value?: number; max?: number };
  select: { value?: string | number | null; size?: number };
  td: { colspan?: number; rowspan?: number };
  th: {
    colspan?: number;
    rowspan?: number;
    scope?: "row" | "col" | "rowgroup" | "colgroup";
  };
  textarea: { value?: string | number | null; rows?: number; cols?: number };
  video: { width?: number | string; height?: number | string; poster?: string };
  audio: { preload?: "none" | "metadata" | "auto" };
}

type OverridesOf<Tag> = Tag extends keyof Overrides ? Overrides[Tag] : object;

/* ─────────────────────────────── SVG / MathML ──────────────────────────── */

/**
 * У SVG-элементов почти все свойства readonly (`SVGAnimatedLength`), а имена
 * атрибутов пишутся через дефис — вывести из `lib.dom` нечего, перечисляем.
 */
interface SVGAttributes {
  id?: string;
  viewBox?: string;
  xmlns?: string;
  preserveAspectRatio?: string;
  width?: number | string;
  height?: number | string;
  x?: number | string;
  y?: number | string;
  x1?: number | string;
  y1?: number | string;
  x2?: number | string;
  y2?: number | string;
  cx?: number | string;
  cy?: number | string;
  r?: number | string;
  rx?: number | string;
  ry?: number | string;
  d?: string;
  points?: string;
  pathLength?: number | string;
  transform?: string;
  fill?: string;
  "fill-opacity"?: number | string;
  "fill-rule"?: "nonzero" | "evenodd" | "inherit";
  stroke?: string;
  "stroke-width"?: number | string;
  "stroke-linecap"?: "butt" | "round" | "square" | "inherit";
  "stroke-linejoin"?: "miter" | "round" | "bevel" | "inherit";
  "stroke-dasharray"?: string | number;
  "stroke-dashoffset"?: string | number;
  "stroke-opacity"?: number | string;
  opacity?: number | string;
  offset?: number | string;
  "stop-color"?: string;
  "stop-opacity"?: number | string;
  gradientUnits?: string;
  gradientTransform?: string;
  patternUnits?: string;
  "clip-path"?: string;
  "clip-rule"?: string;
  mask?: string;
  filter?: string;
  "marker-start"?: string;
  "marker-mid"?: string;
  "marker-end"?: string;
  "text-anchor"?: "start" | "middle" | "end" | "inherit";
  "dominant-baseline"?: string;
  "font-size"?: number | string;
  "font-family"?: string;
  "font-weight"?: number | string;
  "vector-effect"?: string;
  "shape-rendering"?: string;
  href?: string;
}

type SVGElementAttributes<El> = ElementAttributes<
  El,
  SVGAttributes,
  SVGElementEventMap
> & {
  children?: Child;
};

interface MathMLAttributes {
  id?: string;
  display?: "block" | "inline";
  displaystyle?: boolean;
  mathvariant?: string;
  mathcolor?: string;
  mathbackground?: string;
  mathsize?: string;
  scriptlevel?: number | string;
  stretchy?: boolean;
  fence?: boolean;
  separator?: boolean;
  linethickness?: string;
}

type MathMLElementAttributes<El> = ElementAttributes<
  El,
  MathMLAttributes,
  HTMLElementEventMap
> & {
  children?: Child;
};

/* ───────────────────────────── карта элементов ─────────────────────────── */

/** `a`, `script`, `style`, `title` есть в обеих картах — HTML выигрывает. */
type SVGOnlyTags = Exclude<
  keyof SVGElementTagNameMap,
  keyof HTMLElementTagNameMap
>;

type MathMLOnlyTags = Exclude<
  keyof MathMLElementTagNameMap,
  keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap
>;

/** Неизвестные теги с дефисом — веб-компоненты, их атрибуты не проверяем. */
type CustomElements = {
  [tag: `${string}-${string}`]: Record<string, unknown> & {
    children?: Child;
    ref?: ElementRef<HTMLElement>;
    key?: Key;
  };
};

export type IntrinsicElementsMap = {
  [Tag in keyof HTMLElementTagNameMap]: HTMLAttributes<Tag, OverridesOf<Tag>>;
} & {
  [Tag in SVGOnlyTags]: SVGElementAttributes<SVGElementTagNameMap[Tag]>;
} & {
  [Tag in MathMLOnlyTags]: MathMLElementAttributes<
    MathMLElementTagNameMap[Tag]
  >;
} & CustomElements;

/** Пропы конкретного тега — удобно для обёрток: `Props = IntrinsicProps<"input">`. */
export type IntrinsicProps<Tag extends keyof IntrinsicElementsMap> =
  IntrinsicElementsMap[Tag];
