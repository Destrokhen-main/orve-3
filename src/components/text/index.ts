import { createText, remove, setText } from "../../utils/helperNode";

export class TextNode {
  htmlElement: Text | null = null;

  constructor(private text: string) {}

  mounter() {
    this.htmlElement = createText(this.text);
    return this.htmlElement;
  }

  updater(newText: string) {
    if (this.text === newText || !this.htmlElement) {
      return;
    }

    setText(this.htmlElement, newText);
    this.text = newText;
  }

  unMounter() {
    if (!this.htmlElement) {
      return;
    }

    remove(this.htmlElement);
    this.htmlElement = null;
  }
}
