import { Computed } from "../../core/reactive/computed";
import { setEffectOnces } from "../../core/reactive/core";
import { State } from "../../core/reactive/state";
import { createText, insert, remove, setText } from "../helperNode";
import { stringValue } from "../helperNode/stringValue";

export class TextNode {
  private element: Text | null = null;
  constructor(private text: string | State<any> | Computed<any>) {}

  mounted(node: Element) {
    this.element = createText("");

    if (this.text instanceof State || this.text instanceof Computed) {
      setEffectOnces(() => {
        setText(this.element, stringValue(this.text));
      });
    } else {
      setText(this.element, this.text);
    }

    insert(this.element, node);
  }

  unMounted() {
    remove(this.element, !!this.element?.parentNode);
    this.element = null;
  }
}
