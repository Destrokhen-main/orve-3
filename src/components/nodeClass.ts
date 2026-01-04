import { JSX } from "react";
import { ComponentClass, componentInstance } from "./component";
import { textNodeClass, TextNodeClass } from "./textNodeClass";
import { ContextComponent } from "./type";

export class NodeClass {
  /*
    Надо подумать, над тем, чтоб обычные ноды, обрабатывались через этот класс
    Это нужно для того, чтобы, правильно работать с реактивными пропсами, тут это будет происходить
    Это если компонент не возвращает функцию, а возвращает сразу JSX которые не будет перерендериваться
  */
  private element: Element | null = null;
  private children: (ComponentClass<any> | TextNodeClass | NodeClass)[] = [];
  private contextComponent: ContextComponent = {
    canSetup: null,
    mounted: false,
    isRerenderComponent: false,
    levelRender: -1,
  };

  constructor(
    private node: JSX.Element,
    levelRender: number,
  ) {
    this.contextComponent.levelRender = levelRender;
  }

  async setup() {
    const childrenArray: JSX.Element[] = Array.isArray(this.node.props.children)
      ? this.node.props.children
      : [this.node.props.children];

    const reverseChildren = [...childrenArray].reverse();
    while (reverseChildren.length > 0) {
      const item = reverseChildren.pop()!;

      if (typeof item.type === "function") {
        const component = componentInstance(item.type, {
          levelRender: this.contextComponent.levelRender + 1,
        });

        await component.setup(item.props);
        this.children.push(component);
      } else if (typeof item === "string") {
        const node = textNodeClass(item, this.contextComponent.levelRender + 1);
        this.children.push(node);
      } else if (item !== null) {
        const node = nodeClass(item, this.contextComponent.levelRender + 1);
        await node.setup();
        this.children.push(node);
      }
    }
  }

  mounted(node: Element) {
    let nodeClass = document.createElement(this.node.type);

    for (const item of this.children) {
      nodeClass = item.mounted(nodeClass);
    }

    node.appendChild(nodeClass);
    return node;
  }
}

export function nodeClass(node: JSX.Element, levelRender: number) {
  return new NodeClass(node, levelRender);
}
