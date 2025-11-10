import { Computed } from "../computed";
import { State } from "../state";

export type Reactive = State<unknown> | Computed<unknown>;