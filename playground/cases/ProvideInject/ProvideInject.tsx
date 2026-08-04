import { inject, provide } from "orve"

// Надо сделать работу тут
const Component = () => {
  const obj = inject<{ test: number }>(key);
  return () => (
    <div>
      { obj?.test ?? 'not send' }
    </div>
  )
}

const key = Symbol('test');

export const ProvideInject = () => {
  provide(key, {
    test: 1,
  })

  return () => (
    <section>
      <Component />
    </section>
  )
}
