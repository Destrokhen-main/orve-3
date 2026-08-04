import { createText, setText } from "../../utils/helperNode/index.js";
import { isPrimitiveChild, toText } from "../jsx.js";
import { Child } from "../types.js";
import { BaseView } from "./base.js";

export class TextView extends BaseView {
  private node: Text | null = null;

  constructor(private text: string) {
    super();
  }

  mount(parent: Node, anchor: Node | null) {
    this.parentNode = parent;
    this.node = createText(this.text);
    parent.insertBefore(this.node, anchor);
    this.mounted = true;
  }

  update(next: Child): boolean {
    if (!isPrimitiveChild(next)) {
      return false;
    }

    const text = toText(next);
    if (text !== this.text) {
      this.text = text;
      if (this.node) {
        setText(this.node, text);
      }
    }
    return true;
  }

  nodes(): Node[] {
    return this.node ? [this.node] : [];
  }

  unmount() {
    super.unmount();
    this.node?.parentNode?.removeChild(this.node);
    this.node = null;
  }
}
