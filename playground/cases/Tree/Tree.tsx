import { single, state } from "orve"

export const SingleComp = single(() => {
  const num = state(0);

  return () => (
    <div>
      <h3>Single</h3>
      {num}
      <br />
      {Math.random()}
      <br />
      <button onClick={() => num.set((v) => v + 1 )}>single reload</button>
    </div>
  )
})

export const Base = () => {
  const num = state(0);

  return () => (
    <div>
      <h3>Base</h3>
      {num.value}
      <br />
      {Math.random()}
      <br />
      <button onClick={() => num.set((v) => v + 1 )}>base reload</button>
    </div>
  )
}

export const Tree = () => {
  const num = state(0);

  return () => (
    <section>
      <SingleComp />
      <Base />
      <hr />
      {num.value}
      <br />
      <button onClick={() => num.set((v) => v + 1 )}>main reload</button>
    </section>
  )
}
