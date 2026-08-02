import { For, If, computed, createInstance, single, state } from "orve";
import { Component } from "../src/components/component-orve";

/**
 * Черновик для ручных проверок. Правь как угодно — Vite перезагрузит страницу.
 * Импорт из "orve" ведёт прямо в src/, сборка библиотеки не нужна.
 */

// БАЗОВЫЙ режим: render перевызывается, в слотах пишем значения
const Basic = () => {
  const count = state(0);
  const double = computed(() => count.value * 2);

  return () => (
    <section>
      <h2>Базовый</h2>
      <p>
        {count.value} × 2 = {double.value}
      </p>
      {count.value > 2 && <p class="warn">больше двух</p>}
      <button onClick={() => count.set((v) => v + 1)}>+1</button>
    </section>
  );
};

// СИНГЛ режим: render один раз, в слотах — сигнал или тонк
const Single = single(() => {
  const count = state(0);
  const items = state<string[]>([]);

  return () => (
    <section>
      <h2>Сингл</h2>
      <p class={() => (count.value > 2 ? "warn" : "")}>{count}</p>

      <If 
        when={() => count.value > 0} 
        then={() => <p>уже что-то есть</p>}
        else={() => <p>пока ноль</p>}
      />

      <ul>
        <For each={items}>
          {(item: string, index: number) => <li key={index}>{item}</li>}
        </For>
      </ul>

      <button
        onClick={() => {
          count.set((v) => v + 1);
          items.set((list) => [...list, `строка ${list.length + 1}`]);
        }}
      >
        +1
      </button>
    </section>
  );
});


const Comp1 = (props: { text: string }) => {
  return () => (
    <div>
      BASE: {props.text}
    </div>
  )
}

const Comp2 = single((props: { text: any }) => {
  return () => (
    <div>
      SINGLE: {() => props.text}
    </div>
  )
})

const PropsDrilling = () => {
  const inp = state('');

  return () => (
    <section>
      <Comp1 text={inp.value}/>
      <Comp2 text={inp.value}/>
      <input onInput={(e: any) => inp.value = e.target.value} />
    </section>
  )
}

const BaseInput = () => {
  const inp = state('');

  return () => (
    <section>
      <div>{inp.value}</div>
      <input onInput={(e: any) => inp.value = e.target.value} />
    </section>
  )
}

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
    }

    return null;
  })

  return () => (
    <>
      <button class={page.value === 1 ? "active" : ""} onClick={() => page.set(1)}>BASIC</button>
      <button class={page.value === 2 ? "active" : ""} onClick={() => page.set(2)}>Single</button>
      <button class={page.value === 3 ? "active" : ""} onClick={() => page.set(3)}>Case 1</button>
      <button class={page.value === 4 ? "active" : ""} onClick={() => page.set(4)}>Case 2</button>
      <Component is={switchComp.value} />
    </>
  );
};

createInstance().rootComponent(App).mountRoot("#app");
