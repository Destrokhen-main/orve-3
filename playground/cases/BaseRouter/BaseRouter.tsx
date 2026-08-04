import { requirePlugin, state } from "orve"
import { RouterLink } from "./router"

export const BaseRouter = () => {
  const router = requirePlugin('$router') as any;

  const a = state(1);

  return () => (
    <section>
      <button onClick={() => { router.push('/') }}>Route 1</button>
      <button onClick={() => { router.push('/a') }}>Route 2</button>
      <br />
      {a.value}
      <button onClick={() => a.set(v => v + 1 )}>+</button>
      <br />
      <RouterLink t={a.value}>
        text
      </RouterLink>
    </section>
  )
}