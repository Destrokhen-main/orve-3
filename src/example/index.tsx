import { createInstance } from "../instance";

const Component = () => {
  return () => (
    <>
      <div>Hello world</div>
    </>
  )
}

createInstance().rootComponent(Component).mountRoot('#app');