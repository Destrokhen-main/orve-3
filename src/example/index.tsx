import { state } from "../core/reactive";
import { createInstance } from "../instance";

const Component = () => {
  const a = state(1);

  return () => (
    <>
      <div>{a.value}</div>
    </>
  )
}

createInstance().rootComponent(Component).mountRoot('#app');