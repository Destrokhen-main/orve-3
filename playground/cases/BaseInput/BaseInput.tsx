import { state } from "orve";

export const BaseInput = () => {
  const inp = state('');

  return () => (
    <section>
      <div>{inp.value}</div>
      <input onInput={(e: any) => inp.value = e.target.value} />
    </section>
  )
}