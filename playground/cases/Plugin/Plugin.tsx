import { defineOptions, onUnmounted, usePlugin, usePlugins } from "orve";
import { UseStore } from "./user";

const ComponentBase = () => {
  const store = usePlugin('store') as UseStore;

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

  const store = usePlugin('store') as UseStore;

  return () => (
    <div>
      <h2>COMPONENT SINGLE</h2>
      {store.num} / {store.num2}
      <button onClick={() => store.updateNum(store.num.value + 1)}>update</button>
    </div>
  )
}

export const Plugin = () => {
  const store = usePlugin('store') as UseStore;

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
