import { computed, single, state } from "orve"

const Comp1 = (props: { text: string }) => {
  return () => (
    <div>
      BASE: {props.text}
    </div>
  )
}

const Comp2 = single((props: { text: any }) => {
  const text = computed(() => props.text)

  return () => (
    <div>
      SINGLE: {text}
    </div>
  )
})

export const PropsDrilling = () => {
  const inp = state('');

  return () => (
    <section>
      <Comp1 text={inp.value}/>
      <Comp2 text={inp.value}/>
      <input onInput={(e: any) => inp.value = e.target.value} />
    </section>
  )
}