import { defineOptions } from "orve";
import { TodoBasic } from "./Todo.base";
import { TodoSingle } from "./Todo.single";

export type Todo = {
  id: number;
  name: string;
  done: boolean;
};

// Рут определяем при необходимость, не обязательно указывать single
export const Todo = () => {
  defineOptions({
    single: true,
  });

  return () => (
    <>
      <TodoSingle />
      <TodoBasic />
    </>
  )
}
