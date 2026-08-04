import { inject, provide, State, state } from "orve"

const key = Symbol('test');

const Button = () => {
  const obj = inject<{ test: State<number> }>(key);

  return () => (
    <button onClick={() => obj?.test.set(obj.test.value + 1)}>
      +
    </button>
  )
}

const Component = () => {
  const obj = inject<{ test: State<number> }>(key);
  return () => (
    <div>
      {obj?.test.value ?? 'not send'}
      <Button />
    </div>
  )
}

export const ProvideInject = () => {
  const num = state(1)

  provide(key, {
    test: num,
  })

  return () => (
    <section>
      <Component />
    </section>
  )
}
