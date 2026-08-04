import { requirePlugin } from "orve"
import { RouterLink } from "./router"

export const BaseRouter = () => {
  const router = requirePlugin('$router') as any;

  return () => (
    <section>
      <button onClick={() => { router.push('/') }}>Route 1</button>
      <button onClick={() => { router.push('/a') }}>Route 2</button>
      <br />
      <RouterLink>
        text
      </RouterLink>
    </section>
  )
}