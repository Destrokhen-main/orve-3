import { computed, For, If, single, State, state } from "orve";
import { TodoBasic } from "./Todo.base";
import { TodoSingle } from "./Todo.single";

export type Todo = {
  id: number;
  name: string;
  done: boolean;
};

// Рут определяем при необходимость, не обязательно указывать single
export const Todo = single(() => {
  return () => (
    <>
      <TodoSingle />
      <TodoBasic />
    </>
  )
})
