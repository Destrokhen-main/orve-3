import { state, If, For, defineOptions } from "orve";
import { Todo } from "./Todo.js";

const Form = ({ createTodo }: { createTodo: (name: string) => void }) => {
  defineOptions({
    single: true,
  });

  const errorMessage = state<string | null>(null);
  const name = state('');

  const save = () => {
    if (errorMessage.value !== null) {
      errorMessage.set(null);
    }

    if (name.value === '') {
      errorMessage.set('Name is required');
      return;
    }

    createTodo(name.value);
    name.set('');
  }

  return () => (
    <section>
      <If
        when={() => errorMessage.value !== null}
        then={() => <i style="color: red">{errorMessage.value}</i>}
      />
      <form onSubmit={(e: SubmitEvent) => { e.preventDefault(); save() }}>
        <input value={name} onInput={(e: any) => name.set(e.target.value)} placeholder="name" />
        <br />
        <button>Add</button>
      </form>
    </section>
  )
}

const List = (props: { list: Todo[], switchStatus: (id: number) => void, deleteTodo: (id: number) => void }) => {
  defineOptions({
    single: true,
  });

  return () => (
    <section>
      <For each={() => props.list}>
        {(todo: Todo) => {
          const style = `font-weight: ${todo.done ? 'bold' : 'normal'}`;

          return (<div key={todo.id} style={style}>
            {todo.name} <input type="checkbox" checked={todo.done} onChange={() => props.switchStatus(todo.id)} />
            <button onClick={() => props.deleteTodo(todo.id)}>х</button>
          </div>
          )
        }}
      </For>
    </section>
  )
}

export const TodoSingle = () => {
  defineOptions({
    single: true,
  });

  const listTodo = state<Todo[]>([
    { id: 1, name: 'test-1', done: false },
    { id: 2, name: 'test-2', done: true },
  ]);

  const addTodo = (todo: string) => {
    listTodo.set((v) => [...v, { id: Math.random(), name: todo, done: false }]);
  };

  const switchStatus = (id: number) => {
    listTodo.set((v) => v.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo));
  }

  const deleteTodo = (id: number) => {
    listTodo.set((v) => v.filter((todo) => todo.id !== id));
  }

  return () => (
    <section>
      <h1>SINGLE</h1>
      <div style="text-align: center">
        <i>All: {() => listTodo.value.length}</i>
      </div>
      <Form createTodo={addTodo} />
      <List list={listTodo} switchStatus={switchStatus} deleteTodo={deleteTodo}/>
    </section>
  )
}
