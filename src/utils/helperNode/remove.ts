export function remove(child: Element | Text, hasParent: boolean = true) {
  if (!hasParent) {
    child.remove();
  }
  child.parentNode?.removeChild(child);
}
