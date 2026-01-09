export function insert(
  child: Element,
  parent: Element,
  anchor: Node | null = null,
) {
  parent.insertBefore(child, anchor);
}

export function insertAfter(child: Element, parent: Element) {
  parent.after(child);
}
