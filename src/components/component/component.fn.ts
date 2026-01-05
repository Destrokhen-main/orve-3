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

  private unMountedElements() {
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
  }

  private reMounted(node: Element) {
    const render = this.render();

    if (this.lastRender !== null && render === null) {
      this.unMountedElements();
    }

    const diff = this.diffRender(render);
    if (diff === "all") {
      this.unMountedElements();

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

  private diffRender(render: RenderComponent): "all" | undefined {
    if (!this.lastRender) {
      return "all";
    }

    if (
      (PRIMITIVE.includes(typeof this.lastRender) ||
        this.lastRender === null) &&
      render !== this.lastRender
    ) {
      return "all";
    }
    // проверить что поменялось относительно прошлого рендера
  }
}
