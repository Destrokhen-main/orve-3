import { core, setEffectOnces } from "../../core/reactive/core";
import { TextNode } from "../textNode";
import { RenderComponent } from "../type";
import { PRIMITIVE } from "./constants";
import { isJsx } from "../utils";
import { Node } from "../node";
import { JSX } from "react";

export class ComponentFn {
  private elements: (TextNode | Node)[] = [];
  private effect: (() => void) | null = null;
  private lastRender: RenderComponent | undefined = undefined;

  constructor(private render: () => RenderComponent) {}

  mounted(node: Element) {
    this.effect = () => {
      this.reMounted(node);
    };
    setEffectOnces(this.effect);
  }

  unMounted() {
    if (!this.effect) {
      return;
    }
    core.deleteByEffect(this.effect);
    this.elements.forEach((el) => {
      // el.remove();
      // надо все элементы удалить и размонтировать
    });
    this.effect = null;
  }

  private unMountedElements() {
    if (this.elements.length > 0) {
      // снесу вообще всё;
      this.elements.forEach((el) => {
        if (el instanceof TextNode || el instanceof Node) {
          el.unMounted();
        }
      });
      this.elements = [];
    }
  }

  private reMounted(node: Element) {
    const render = this.render();
    if (this.lastRender !== null && render === null) {
      this.unMountedElements();
      this.lastRender = null;
      return;
    }

    if (this.lastRender === undefined && render !== null) {
      if (PRIMITIVE.includes(typeof render)) {
        const textNode = new TextNode(render as string);
        textNode.mounted(node);
        this.elements.push(textNode);
      }

      if (isJsx(render)) {
        const _node = new Node(render, { isFnNode: true });
        _node.setup();
        _node.mounted(node);
        this.elements.push(_node);
      }
    }

    if (this.lastRender !== undefined) {
      if (
        PRIMITIVE.includes(typeof render) &&
        PRIMITIVE.includes(typeof this.lastRender)
      ) {
        (this.elements[0] as TextNode).reMounted(render as string);
      } else if (
        PRIMITIVE.includes(typeof render) &&
        this.lastRender === null
      ) {
        const textNode = new TextNode(render as string);
        textNode.mounted(node);
        this.elements.push(textNode);
      } else if (PRIMITIVE.includes(typeof render) && isJsx(this.lastRender)) {
        this.unMountedElements();
        const _node = new Node(render as JSX.Element, { isFnNode: true });
        _node.setup();
        _node.mounted(node);
        this.elements.push(_node);
      } else if (isJsx(this.lastRender) && isJsx(render)) {
        (this.elements[0] as Node).reMounted(render);
      }
    }

    this.lastRender = render;
  }

  getElement() {
    return this.elements;
  }
}
