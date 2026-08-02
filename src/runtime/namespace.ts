export type NS = "html" | "svg" | "mathml";

export const SVG_URI = "http://www.w3.org/2000/svg";
export const MATHML_URI = "http://www.w3.org/1998/Math/MathML";

/**
 * Текущее пространство имён при построении дерева. Держим в модуле, а не
 * тащим через каждую сигнатуру: монтирование синхронно, а представления,
 * которые досоздают детей позже (Dynamic/Fragment/Component), запоминают
 * своё значение в конструкторе и восстанавливают его через `withNS`.
 */
let current: NS = "html";

export function getNS(): NS {
  return current;
}

export function withNS<T>(ns: NS, fn: () => T): T {
  const prev = current;
  current = ns;
  try {
    return fn();
  } finally {
    current = prev;
  }
}

/** В каком пространстве создаётся сам тег. */
export function elementNS(tag: string, ns: NS): NS {
  if (tag === "svg") {
    return "svg";
  }
  if (tag === "math") {
    return "mathml";
  }
  return ns;
}

/** В какое пространство попадают его дети. */
export function childNS(tag: string, ns: NS): NS {
  // сам foreignObject живёт в svg, а его содержимое — обычный HTML
  if (ns === "svg" && tag === "foreignObject") {
    return "html";
  }
  return elementNS(tag, ns);
}
