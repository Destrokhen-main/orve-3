import { JSX } from "react";

export type RenderComponent = JSX.Element | string | number | null;
export type Props = Record<string, any> | undefined;
export type Component<T extends Props = undefined> = (
  props: T,
) => RenderComponent | (() => RenderComponent);
export type ComponentInstanceOptions = {
  levelRender: number;
  isChild?: boolean;
  isRerenderComponent?: boolean;
};
export type ContextComponent = {
  canSetup: boolean | null;
  mounted: boolean;
  isRerenderComponent: boolean;
  levelRender: number;
  key?: string;
};
