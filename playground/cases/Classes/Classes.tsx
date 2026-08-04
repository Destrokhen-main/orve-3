import { defineOptions, state } from "orve"

const BASE = () => {
  const isWarn = state(false);

  return () => (
    <div>
      <span
        class={{
          warn: isWarn.value
        }}
      >TEXT</span>
      <br />
      <button onClick={() => isWarn.set((v) => !v)}>{isWarn.value ? '+' : '-'}</button>
    </div>
  )
}

const SINGLE = () => {
  defineOptions({
    single: true,
  })

  const isWarn = state(false);

  return () => (
    <div>
      <span class={() => {
        return {
          warn: isWarn.value
        }
      }}>TEXT</span>
      <br />
      <button onClick={() => isWarn.set((v) => !v)}>{() => isWarn.value ? '+' : '-'}</button>
    </div>
  )
}

export const Classes = () => {
  return () => (
    <section>
      <BASE />
      <SINGLE />
    </section>
  )
}
