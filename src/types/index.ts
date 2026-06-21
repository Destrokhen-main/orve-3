import { JSX } from "react";

export type Fn<T extends Record<string, unknown>> = (props: T) => () => JSX.Element