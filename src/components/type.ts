import { JSX } from "react";

export type RenderComponent = JSX.Element | string | null
export type Props = Record<string, any> | undefined;
export type Component<T extends Props = undefined> = (props: T) => RenderComponent | (() => RenderComponent)
export type ComponentInstanceOptions = {
  levelRender: number
};