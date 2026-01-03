export function insert(to: Element, child: Element, anchor?: Element) {
  if (anchor) {
    to.insertBefore(anchor, child);
  } else {
    to.appendChild(child);
  }
}