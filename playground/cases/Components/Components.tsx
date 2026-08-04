import { Child, Component, ComponentFn, computed, Props, state } from "orve"

const Layout1: ComponentFn = (props) => {
  return () => (
    <div style="color: red">
      {props.children}
    </div>
  )
}

const Layout2: ComponentFn = (props) => {
  return () => (
    <div style="color: yellow">
      {props.children}
    </div>
  )
}

export const Comp: ComponentFn = () => {
  const a = state(true);

  const c = computed(() => {
    return a.value ? Layout1 : Layout2
  })

  return () => (
    <section>
      <input type="checkbox" checked={a} onInput={() => a.set(v => !v)}/>
      <Component is={c}>
        asdas
        <div>asdasf</div>
      </Component>
    </section>
  )
}