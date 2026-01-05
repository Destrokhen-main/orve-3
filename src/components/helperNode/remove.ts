export function remove(child: any, hasParent: boolean = true) {
  if (!hasParent) {
    child.remove();
  }
  child.parentNode.removeChild(child);
}
