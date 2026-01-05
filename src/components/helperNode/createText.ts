export function createText(text: string) {
  return document.createTextNode(text);
}

export function setText(node: any, text: string) {
  node.nodeValue = text;
}
