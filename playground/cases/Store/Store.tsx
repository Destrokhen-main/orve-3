import { defineOptions, onUnmounted } from "orve";
import { resetStore, useStore } from "./user";

const ComponentBase = () => {
  const store = useStore();

  return () => (
    <div>
      <h2>COMPONENT BASE</h2>
      {store.num.value} / {store.num2.value}
      <button onClick={() => store.updateNum(store.num.value + 1)}>update</button>
    </div>
  )
}

const ComponentSingle = () => {
  defineOptions({
    single: true,
  })

  const store = useStore();

  return () => (
    <div>
      <h2>COMPONENT SINGLE</h2>
      {store.num} / {store.num2}
      <button onClick={() => store.updateNum(store.num.value + 1)}>update</button>
    </div>
  )
}

export const Store = () => {
  const store = useStore();

  return () => (
    <section>
      <h1>MAIN</h1>
      {store.num.value} / {store.num2.value}

      <button onClick={() => store.updateNum(store.num.value + 1)}>update</button>

      <ComponentBase />
      <ComponentSingle />
    </section>
  )
}
