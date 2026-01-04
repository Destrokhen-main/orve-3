import { ContextComponent } from "./type";

export class TextNodeClass {
  private element: Text | null = null;
  private contextComponent: Partial<ContextComponent> = {
    mounted: false,
    levelRender: -1,
  };

  constructor(
    private text: string,
    levelRender: number,
  ) {
    this.contextComponent.levelRender = levelRender;
  }

  mounted(node: Element) {
    this.element = document.createTextNode(this.text);
    node.appendChild(this.element);
    this.contextComponent.mounted = true;
    return node;
  }
}

export function textNodeClass(text: string, levelRender: number) {
  return new TextNodeClass(text, levelRender);
}
