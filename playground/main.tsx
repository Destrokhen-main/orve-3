import { computed, createInstance, defineOptions, state } from "orve";
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
import { Store } from "./cases/Store/Store";

const arrayComponent = [Basic, Single, BaseInput, PropsDrilling, Styles, Classes, AsyncCase, Tree, ProvideInject, Todo, Store];
const arrayButton = ['BASIC', 'Single', 'Case 1', 'Case 2', 'Styles', 'Classes', 'Async', 'Tree', 'Provide/Inject', 'TODO', 'Store'];

const debugPage = null;

const App = () => {
  defineOptions({
    single: true,
  })

  const page = state(debugPage ?? arrayComponent.length);

  const switchComp = computed(() => {
    return arrayComponent[page.value - 1] ?? null;
  })

  return () => (
    <>
      {
        arrayButton.map((item, index) => (
          <button class={() => page.value === index + 1 ? "active" : ""} onClick={() => page.set(index + 1)}>{item}</button>
        ))
      }
      <div class="mt-2">
        <Component is={switchComp} />
      </div>
    </>
  );
};

createInstance().rootComponent(App).mountRoot("#app");
