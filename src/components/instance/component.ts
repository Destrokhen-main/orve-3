import type { Component, RenderComponent, Props } from "./type";

export class ComponentClass<T extends Props> {
  public render: RenderComponent = undefined;
  public isRecalabelComponent = false;

  constructor(
    private fnComponent: Component<T>,
    public levelRender: number = 1
  ) {}

  setup(props: T) {
    const component = this.fnComponent(props);

    if (typeof component === "function") {
      this.isRecalabelComponent = true;
    }

    this.render = component;
  }
}