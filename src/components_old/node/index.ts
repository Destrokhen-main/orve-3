import { JSX } from "react";
import { TextNode } from "../textNode";
import { FRAGMENT, PRIMITIVE } from "../component/constants";
import { isJsx } from "../utils";
import {
  insert,
  patchProps,
  remove,
  replaceElement,
} from "../../utils/helperNode";
import { ComponentClass, componentInstance } from "../component/component";

type OptionsNode = {
  isFnNode: boolean;
  isTypeFn?: boolean;
  parent?: ComponentClass<any> | Node;
};

export class Node {
  private element: Element | null = null;
  private type: JSX.Element["type"];
  private childrens: (Node | TextNode | ComponentClass<any>)[] = [];
  private props: Record<string, any> = {};
  private parent: ComponentClass<any> | Node | null = null;

  constructor(
    private jsx: JSX.Element,
    private options: OptionsNode,
  ) {
    this.parent = options.parent ?? null;
  }

  setup(jsx?: JSX.Element) {
    const workJsx = jsx ?? this.jsx;

    this.type = workJsx.type;
    this.options.isTypeFn = typeof this.type === "function";

    const childrens: any[] = Array.isArray(workJsx.props.children)
      ? workJsx.props.children
      : [workJsx.props.children];

    const { children, ...pr } = workJsx.props;
    this.props = pr;

    for (const i of childrens) {
      if (PRIMITIVE.includes(typeof i)) {
        const textNode = new TextNode(i);
        this.childrens.push(textNode);
      } else if (isJsx(i)) {
        if (typeof i.type === "function") {
          const node = componentInstance(i.type, {
            isRerenderComponent: true,
            levelRender: 1,
          });
          node.setup(i.props);
          this.childrens.push(node);
        } else {
          const node = new Node(i, { isFnNode: this.options.isFnNode });
          node.setup();
          this.childrens.push(node);
        }
      }
    }
  }

  mounted(node: Element, needReplace: boolean = false) {
    if (this.options.isTypeFn) {
      (this.childrens[0] as ComponentClass<any>).mounted(node);
      return;
    }

    let currNode = null;

    // если type функция, надо подумать
    // похоже надо вызывать компонент новый

    if (this.type === FRAGMENT) {
      currNode = node;
    }

    if (typeof this.type === "string") {
      currNode = document.createElement(this.type);
    }

    const keysProps = Object.keys(this.props);

    for (const key of keysProps) {
      const value = this.props[key];
      patchProps(currNode, key, null, value);
    }

    for (const i of this.childrens) {
      i.mounted(currNode!);
    }

    if (this.type !== FRAGMENT) {
      if (needReplace) {
        replaceElement(node, currNode!);
      } else {
        insert(currNode!, node);
      }
    }
    this.element = currNode;
  }

  getElement() {
    return this.element;
  }

  reMounted(jsx: JSX.Element) {
    // TODO тут пока хз может надо переделать

    const { children, ...props } = jsx.props;

    const childrens = Array.isArray(children) ? children : [children];

    // смотрим на key

    // проверяем type
    if (jsx.type !== this.type) {
      // размонтирую все элементы
      // const nodeBefore = this.element;
      // const node = nodeBefore!.nextElementSibling;
      this.unMounted();
      this.options.isTypeFn = typeof jsx.type === "function";
      if (typeof jsx.type === "function") {
        const component = componentInstance(jsx.type, {
          isRerenderComponent: true,
          levelRender: 1,
        });
        component.setup(jsx.props);
        // надо думать как монтировать в таком случае
        // component.mounted(node!);
      } else if (jsx.type === FRAGMENT) {
        console.log(jsx);
        //
      }
    }

    // проверяем props
    const allProps = new Set([
      ...Object.keys(props),
      ...Object.keys(this.props),
    ]);
    for (const prop of allProps) {
      const oldValue = this.props[prop] ?? null;
      const newValue = props[prop] ?? null;

      if (newValue === null) {
        patchProps(this.element, prop, null, null);
      } else if (oldValue === null) {
        patchProps(this.element, prop, null, newValue);
      } else if (
        typeof oldValue === "object" &&
        typeof newValue === "object" &&
        !Object.is(oldValue, newValue)
      ) {
        patchProps(this.element, prop, oldValue, newValue);
      } else if (oldValue !== newValue) {
        patchProps(this.element, prop, oldValue, newValue);
      }
    }
    this.props = props;

    // проверяем children
    // console.log(children, this.childrens);
    for (let i = 0; i !== childrens.length; i++) {
      const children = childrens[i];
      const childrenNode = this.childrens[i];

      if (!childrenNode) {
        if (PRIMITIVE.includes(typeof children)) {
          const textNode = new TextNode(children);
          textNode.mounted(this.element!);
          this.childrens.push(textNode);
        } else if (isJsx(children)) {
          const node = new Node(children, { isFnNode: this.options.isFnNode });
          node.setup();
          node.mounted(this.element!);
        }
        continue;
      }

      if (
        (isJsx(children) && childrenNode instanceof Node) ||
        (PRIMITIVE.includes(typeof children) &&
          childrenNode instanceof TextNode)
      ) {
        childrenNode.reMounted(children);
      } else if (
        PRIMITIVE.includes(typeof children) &&
        childrenNode instanceof Node
      ) {
        const textNode = new TextNode(children);
        textNode.mounted(childrenNode.getElement()!, true);
        this.childrens[i] = textNode;
      } else if (isJsx(children) && childrenNode instanceof TextNode) {
        const node = new Node(children, { isFnNode: this.options.isFnNode });
        node.setup();
        // тут будет все равно replace
        node.mounted(childrenNode.getElement() as any, true);
        this.childrens[i] = node;
      }
    }

    if (childrens.length < this.childrens.length) {
      for (let i = children.length; i !== this.childrens.length; i++) {
        const item = this.childrens[i];
        item.unMounted();
      }
      this.childrens = this.childrens.slice(0, childrens.length);
    }
  }

  unMounted() {
    if (!this.element) {
      return;
    }

    this.childrens.forEach((children) => {
      children.unMounted();
    });
    remove(this.element, true);
    this.element = null;
  }
}
