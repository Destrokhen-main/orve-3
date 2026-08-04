import { defineOptions } from "orve";
import { TodoBasic } from "./Todo.base.js";
import { TodoSingle } from "./Todo.single.js";

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
