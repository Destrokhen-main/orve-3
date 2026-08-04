import { For, If, computed, createInstance, single, state } from "orve";
import { Component } from "../src/components/component-orve";
import { Basic } from "./cases/Base/Base";
import { Single } from "./cases/Single/Single";
import { BaseInput } from "./cases/BaseInput/BaseInput";
import { PropsDrilling } from "./cases/PropsDrilling/PropsDrilling";
import { Styles } from "./cases/Styles/Styles";
import { Classes } from "./cases/Classes/Classes";
import { AsyncCase } from "./cases/AsyncCase/Async";
import { Tree } from './cases/Tree/Tree';
import { Todo } from "./cases/Todo/Todo";
import { ProvideInject } from "./cases/ProvideInject/ProvideInject";

const arrayComponent = [Basic, Single, BaseInput, PropsDrilling, Styles, Classes, AsyncCase, Tree, ProvideInject, Todo];

const debugPage = null;

const App = single(() => {
  const page = state(debugPage ?? arrayComponent.length);

  const switchComp = computed(() => {
    return arrayComponent[page.value - 1] ?? null;
  })

  return () => (
    <>
      <button class={() => page.value === 1 ? "active" : ""} onClick={() => page.set(1)}>BASIC</button>
      <button class={() => page.value === 2 ? "active" : ""} onClick={() => page.set(2)}>Single</button>
      <button class={() => page.value === 3 ? "active" : ""} onClick={() => page.set(3)}>Case 1</button>
      <button class={() => page.value === 4 ? "active" : ""} onClick={() => page.set(4)}>Case 2</button>
      <button class={() => page.value === 5 ? "active" : ""} onClick={() => page.set(5)}>Styles</button>
      <button class={() => page.value === 6 ? "active" : ""} onClick={() => page.set(6)}>Classes</button>
      <button class={() => page.value === 7 ? "active" : ""} onClick={() => page.set(7)}>Async</button>
      <button class={() => page.value === 8 ? "active" : ""} onClick={() => page.set(8)}>Tree</button>
      <button class={() => page.value === 9 ? "active" : ""} onClick={() => page.set(9)}>Provide/Inject</button>
      <button class={() => page.value === 10 ? "active" : ""} onClick={() => page.set(10)}>TODO</button>
      <div class="mt-2">
        <Component is={switchComp} />
      </div>
    </>
  );
});

createInstance().rootComponent(App).mountRoot("#app");
