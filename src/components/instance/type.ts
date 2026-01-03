export type RenderComponent = string | any | null // JSX
export type Props = Record<string, any> | undefined;
export type Component<T extends Props = undefined> = (props: T) => RenderComponent | (() => RenderComponent)