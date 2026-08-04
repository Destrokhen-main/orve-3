import { computed, createInstance, defineOptions, state } from "orve";
import { Component } from "../src/components/component-orve/index.js";
import { Basic } from "./cases/Base/Base.js";
import { PropsDrilling } from "./cases/PropsDrilling/PropsDrilling.js";
import { Styles } from "./cases/Styles/Styles.js";
import { Classes } from "./cases/Classes/Classes.js";
import { AsyncCase } from "./cases/AsyncCase/Async.js";
import { Tree } from './cases/Tree/Tree.js';
import { Todo } from "./cases/Todo/Todo.js";
import { ProvideInject } from "./cases/ProvideInject/ProvideInject.js";
import { Plugin } from "./cases/Plugin/Plugin.js";
import { Async } from "./cases/Async/Async.js";
import { store } from "./cases/Plugin/user.js";
import { Comp } from "./cases/Components/Components.js";

const arrayComponent = [Basic, PropsDrilling, Styles, Classes, AsyncCase, Tree, ProvideInject, Todo, Plugin, Async, Comp];
const arrayButton = ['BASIC', 'Input', 'Styles', 'Classes', 'Async', 'Tree', 'Provide/Inject', 'TODO', 'Plugin', 'With request', 'Components'];

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

createInstance().use(store).rootComponent(App).mountRoot("#app");
