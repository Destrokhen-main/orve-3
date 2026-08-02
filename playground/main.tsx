import { For, If, computed, createInstance, single, state } from "orve";
import { Component } from "../src/components/component-orve";
import { Basic } from "./cases/Base/Base";
import { Single } from "./cases/Single/Single";
import { BaseInput } from "./cases/BaseInput/BaseInput";
import { PropsDrilling } from "./cases/PropsDrilling/PropsDrilling";
import { Styles } from "./cases/Styles/Styles";
import { Classes } from "./cases/Classes/Classes";
import { AsyncCase } from "./cases/AsyncCase/Async";


const App = () => {
  const page = state(0);

  // computed отдаёт сам компонент, а не разметку:
  // пропсы объявляются на <Component/>, где им и место
  const switchComp = computed(() => {
    if (page.value === 1) {
      return Basic
    } else if (page.value === 2) {
      return Single
    } else if (page.value === 3) {
      return BaseInput
    } else if (page.value === 4) {
      return PropsDrilling
    } else if (page.value === 5) {
      return Styles
    } else if (page.value === 6) {
      return Classes
    } else if (page.value === 7) {
      return AsyncCase
    }

    return null;
  })

  return () => (
    <>
      <button class={page.value === 1 ? "active" : ""} onClick={() => page.set(1)}>BASIC</button>
      <button class={page.value === 2 ? "active" : ""} onClick={() => page.set(2)}>Single</button>
      <button class={page.value === 3 ? "active" : ""} onClick={() => page.set(3)}>Case 1</button>
      <button class={page.value === 4 ? "active" : ""} onClick={() => page.set(4)}>Case 2</button>
      <button class={page.value === 5 ? "active" : ""} onClick={() => page.set(5)}>Styles</button>
      <button class={page.value === 6 ? "active" : ""} onClick={() => page.set(6)}>Classes</button>
      <button class={page.value === 7 ? "active" : ""} onClick={() => page.set(7)}>Async</button>
      <div class="mt-2">
        <Component is={switchComp.value} />
      </div>
    </>
  );
};

createInstance().rootComponent(App).mountRoot("#app");
