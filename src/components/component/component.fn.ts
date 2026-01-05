import { Computed } from "../../core/reactive/computed";
import { core, setEffectOnces } from "../../core/reactive/core";
import { State } from "../../core/reactive/state";
import { TextNode } from "../textNode";
import { RenderComponent } from "../type";
import { PRIMITIVE } from "./constants";

export class ComponentFn {
  private elements: any[] = [];
  private effect: (() => void) | null = null;
  private lastRender: any | undefined = undefined;

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

  reMounted(node: Element) {
    const render = this.render();
    const diff = this.diffRender(render);
    if (diff === "all") {
      if (this.elements.length > 0) {
        // снесу вообще всё;
        this.elements.forEach((el) => {
          if (el instanceof TextNode) {
            el.unMounted();
          }
          // el.remove()
        });
        this.elements = [];
      }

      if (render === null) {
        this.lastRender = render;
        return;
      }

      if (PRIMITIVE.includes(typeof render)) {
        const textNode = new TextNode(render as string);
        textNode.mounted(node);
        this.elements.push(textNode);
      }
      this.lastRender = render;
    }
  }

  private diffRender(render: RenderComponent) {
    if (!this.lastRender) {
      return "all";
    }

    if (
      (typeof this.lastRender === "string" || this.lastRender === null) &&
      render !== this.lastRender
    ) {
      return "all";
    }

    if (render instanceof State || render instanceof Computed) {
      // Object.is(this.lastRender, render);
    }

    // проверить что поменялось относительно прошлого рендера
  }
}
