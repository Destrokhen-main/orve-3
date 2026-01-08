import { Computed } from "../../core/reactive/computed";
import { setEffectOnces } from "../../core/reactive/core";
import { State } from "../../core/reactive/state";
import {
  createText,
  insert,
  remove,
  replaceElement,
  setText,
} from "../helperNode";
import { stringValue } from "../helperNode/stringValue";

export class TextNode {
  private element: Text | null = null;
  constructor(private text: string | number | State<any> | Computed<any>) {}

  mounted(node: Element, needReplace: boolean = false) {
    this.element = createText("");

    if (this.text instanceof State || this.text instanceof Computed) {
      setEffectOnces(() => {
        setText(this.element, stringValue(this.text));
      });
    } else {
      setText(this.element, stringValue(this.text));
    }

    if (needReplace) {
      replaceElement(node, this.element);
    } else {
      insert(this.element, node);
    }
  }

  reMounted(text: string | number | State<any> | Computed<any>) {
    if (this.text !== text) {
      setText(this.element, stringValue(text));
    }
  }

  getElement() {
    return this.element;
  }

  unMounted() {
    remove(this.element, !!this.element?.parentNode);
    this.element = null;
  }
}
