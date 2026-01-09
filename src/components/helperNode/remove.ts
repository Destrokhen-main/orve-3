export function remove(child: Element, hasParent: boolean = true) {
  if (!hasParent) {
    child.remove();
  }
  child.parentNode?.removeChild(child);
}
