export function insert(child: any, parent: any, anchor?: any) {
  parent.insertBefore(child, anchor);
}

export function insertAfter(child: any, parent: any) {
  parent.after(child);
}
