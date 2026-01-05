import { setContext } from "../../instance/context";
// import { NodeClass } from "../nodeClass";
import { TextNode } from "../textNode";
// import { TextNodeClass } from "../textNodeClass";
import type {
  Component,
  ComponentInstanceOptions,
  ContextComponent,
  Props,
  RenderComponent,
} from "../type";
import { ComponentFn } from "./component.fn";
import { PRIMITIVE } from "./constants";

export class ComponentClass<T extends Props> {
  /*
    Что тут должно происходить

    Надо попробовать сделать, чтобы компонент, сам проводил валидацию компонента.
    Отдаю сюда функцию компонента.

    Внутри компонента может быть ещё компоненты, они должны храниться в нём, чтобы иметь возможность,
    вызвав destroy и разрушить сразу все компоненты + node.

    нужно хранить все Children

    компоненты могут быть, реактивными единицами

    o-for, o-if

    могут возвращаться как JSX.Element так и функцию которая возвращает JSX.Element или null;

    плюс правильное надо определять когда компонент однорендовый, а когда это функция render.


    компонент должен сам уметь обновлять node и хранить её в себе, чтоб он мог сам работать с ней
  */

  private context: Record<string, any> | null = null;
  private render: ComponentFn | TextNode | null = null;

  // private render: RenderComponent | (() => RenderComponent) | null = null;
  // private children: (ComponentClass<any> | TextNodeClass | NodeClass)[] = [];

  private contextComponent: ContextComponent = {
    canSetup: null,
    mounted: false,
    isRerenderComponent: false,
    levelRender: -1,
  };

  constructor(
    private fn: Component<T>,
    options: ComponentInstanceOptions,
  ) {
    this.contextComponent.levelRender = options.levelRender;
  }

  async setup(props: T) {
    // подготовить надо контекст
    this.context = {};
    setContext(this.context);

    try {
      const render = await this.fn(props);
      if (render === null) {
        return;
      }

      if (typeof render === "function") {
        this.render = new ComponentFn(render);
        return;
      }

      if (PRIMITIVE.includes(typeof render)) {
        this.render = new TextNode(render as string);
        return;
      }

      // if (typeof render !== "function") {
      // }

      // if (this.render === "function") {
      //   this.options.isRerenderComponent = true;
      // }
      // this.contextComponent.canSetup = true;

      // if (!this.render) {
      //   return;
      // }

      // if (typeof this.render === "string") {
      //   const node = textNodeClass(
      //     this.render,
      //     this.contextComponent.levelRender + 1,
      //   );
      //   this.children.push(node);
      //   return;
      // }

      // if (typeof this.render !== "function") {
      //   const childrenArray: JSX.Element[] = Array.isArray(
      //     this.render.props.children,
      //   )
      //     ? this.render.props.children
      //     : [this.render.props.children];

      //   if (this.render.key) {
      //     this.contextComponent.key = this.render.key;
      //   }

      //   const reversedArray = [...childrenArray].reverse();

      //   while (reversedArray.length > 0) {
      //     const item = reversedArray.pop()!;
      //     if (typeof item.type === "function") {
      //       const component = componentInstance(item.type, {
      //         levelRender: this.contextComponent.levelRender + 1,
      //       });

      //       await component.setup(this.render.props);
      //       this.children.push(component);
      //     } else if (typeof item === "string") {
      //       const node = textNodeClass(
      //         item,
      //         this.contextComponent.levelRender + 1,
      //       );
      //       this.children.push(node);
      //     } else if (item !== null) {
      //       const node = nodeClass(item, this.contextComponent.levelRender + 1);
      //       await node.setup();
      //       this.children.push(node);
      //     }
      //   }
      // }
    } catch (err) {
      this.contextComponent.canSetup = false;
      // обнуляем контекст
      this.context = {};
      // что-то надо тут писать
    }
  }

  mounted(node: Element) {
    if (!this.render) {
      return;
    }

    this.render.mounted(node);

    // if (!this.children || this.contextComponent.mounted || !this.render) {
    //   return node;
    // }
    // if (typeof this.render === "string") {
    //   return (this.children[0] as TextNodeClass).mounted(node);
    // }
    // if (typeof this.render !== "function") {
    //   let nodeComponent = document.createElement(this.render.type) as Element;
    //   for (const item of this.children) {
    //     nodeComponent = item.mounted(nodeComponent);
    //   }
    //   node.appendChild(nodeComponent);
    // }
    // return node;
  }

  unMounted() {
    if (!this.render) {
      return;
    }
    this.render.unMounted();
  }
}

export function componentInstance<T extends Props>(
  fnComponent: Component<T>,
  options: ComponentInstanceOptions,
) {
  return new ComponentClass(fnComponent, options);
}
