import { JSX } from "react";

export type Fn<T extends { children: JSX.Element, [key: string]: unknown }> = (props: T) => () => JSX.Element