import { computed, defineOptions, state } from "orve"

const Comp1 = (props: { text: string }) => {
  return () => (
    <div>
      BASE: {props.text}
    </div>
  )
}

const Comp2 = (props: { text: any }) => {
  defineOptions({
    single: true
  })

  return () => (
    <div>
      SINGLE: {() => props.text}
    </div>
  )
}

export const PropsDrilling = () => {
  defineOptions({
    single: true
  })

  const inp = state('');

  return () => (
    <section>
      <Comp1 text={inp}/>
      <Comp2 text={inp}/>
      <input onInput={(e: any) => inp.value = e.target.value} />
    </section>
  )
}
