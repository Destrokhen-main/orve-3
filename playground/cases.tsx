import { computed, defineOptions, state } from "orve";
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
import { Comp } from "./cases/Components/Components.js";
import { BaseRouter } from "./cases/BaseRouter/BaseRouter.js";
import { Lifecycle } from "./cases/Lifecycle/Lifecycle.js";
import { Refs } from "./cases/Refs/Refs.js";
import { Forms } from "./cases/Forms/Forms.js";
import { ForStress } from "./cases/ForStress/ForStress.js";
import { Svg } from "./cases/Svg/Svg.js";
import { Events } from "./cases/Events/Events.js";
import { SlotTypes } from "./cases/SlotTypes/SlotTypes.js";
import { AsyncRace } from "./cases/AsyncRace/AsyncRace.js";
import { Errors } from "./cases/Errors/Errors.js";
import { Slots } from "./cases/Slots/Slots.js";
import { Reactivity } from "./cases/Reactivity/Reactivity.js";

const arrayComponent = [Basic, PropsDrilling, Styles, Classes, AsyncCase, Tree, ProvideInject, Todo, Plugin, Async, Comp, BaseRouter, Lifecycle, Refs, Forms, ForStress, Svg, Events, SlotTypes, AsyncRace, Errors, Slots, Reactivity];
const arrayButton = ['BASIC', 'Input', 'Styles', 'Classes', 'Async', 'Tree', 'Provide/Inject', 'TODO', 'Plugin', 'With request', 'Components', 'BaseRouter', 'Lifecycle', 'Refs', 'Forms', 'For stress', 'SVG', 'Events', 'Slot types', 'Async race', 'Errors', 'Slots', 'Reactivity'];

const debugPage = null;

export const App = () => {
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