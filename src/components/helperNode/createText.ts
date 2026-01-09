export function createText(text: string) {
  return document.createTextNode(text);
}

export function setText(node: Text, text: string) {
  node.nodeValue = text;
}
