import { defineOptions } from "../..";
import { Component } from "../../components/component-orve";
import { computed, nextTick, state } from "../../core/reactive";
import { createInstance } from "../../instance";
import { ComponentFn } from "../types";

function mount(App: ComponentFn<any>) {
  document.body.innerHTML = '<div id="app"></div>';
  const instance = createInstance().rootComponent(App).mountRoot("#app");
  const app = document.getElementById("app")!;

  return {
    instance,
    app,
    get html() {
      return app.innerHTML.replace(/<!---->/g, "");
    },
  };
}

const Red = (props: { text: string }) => () => <b>красный {props.text}</b>;
const Blue = (props: { text: string }) => () => <i>синий {props.text}</i>;

describe("Component", () => {
  it("рендерит то, что лежит в is", () => {
    const App = () => () => <Component is={Red} text="раз" />;

    expect(mount(App).html).toBe("<b>красный раз</b>");
  });

  it("переключает компонент при смене сигнала", async () => {
    const current = state<ComponentFn<any>>(Red);
    const App = () => {
      defineOptions({
        single: true,
      });
      return () => <Component is={current} text="раз" />
    };

    const view = mount(App);
    expect(view.app.querySelector("b")!.textContent).toBe("красный раз");

    current.set(() => Blue);
    await nextTick();

    expect(view.app.querySelector("b")).toBeNull();
    expect(view.app.querySelector("i")!.textContent).toBe("синий раз");
  });

  it("принимает is из computed", async () => {
    const flag = state(true);
    const target = computed(() => (flag.value ? Red : Blue));
    const App = () => {
      defineOptions({
        single: true,
      });
      return () => <Component is={target} text="раз" />
    };

    const view = mount(App);
    expect(view.app.querySelector("b")).not.toBeNull();

    flag.set(false);
    await nextTick();
    expect(view.app.querySelector("i")).not.toBeNull();
  });

  it("прокидывает пропсы и обновляет их без пересоздания", async () => {
    const setup = jest.fn();
    const text = state("раз");

    const Child = (props: { text: string }) => {
      setup();
      return () => <b>{props.text}</b>;
    };

    const App = () => {
      defineOptions({
        single: true,
      });
      return () => <Component is={Child} text={text} />
    };

    const view = mount(App);
    expect(view.app.querySelector("b")!.textContent).toBe("раз");
    expect(setup).toHaveBeenCalledTimes(1);

    text.set("два");
    await nextTick();

    // компонент тот же — setup не перезапускается, меняются только пропсы
    expect(view.app.querySelector("b")!.textContent).toBe("два");
    expect(setup).toHaveBeenCalledTimes(1);
  });

  it("гасит эффекты снятого компонента", async () => {
    const current = state<ComponentFn<any>>(Red);
    const tick = state(0);
    const bind = jest.fn(() => String(tick.value));

    const Watcher = () => {
      defineOptions({
        single: true,
      });
      return () => <b>{bind}</b>
    };

    current.set(() => Watcher);
    const App = () => {
      defineOptions({
        single: true,
      });
      return () => <Component is={current} text="" />
    };

    const view = mount(App);
    expect(bind).toHaveBeenCalledTimes(1);

    current.set(() => Red);
    await nextTick();
    expect(view.app.querySelector("b")!.textContent).toBe("красный ");

    tick.set(1);
    await nextTick();
    // слот размонтированного компонента больше не пересчитывается
    expect(bind).toHaveBeenCalledTimes(1);
  });

  it("прокидывает детей", () => {
    const Frame = (props: { children: unknown }) => () => (
      <section>{props.children}</section>
    );
    const App = () => () => (
      <Component is={Frame}>
        <b>внутри</b>
      </Component>
    );

    expect(mount(App).html).toBe("<section><b>внутри</b></section>");
  });

  it("принимает имя тега строкой", async () => {
    const tag = state("div");
    const App = () => {
      defineOptions({
        single: true,
      });
      return () => <Component is={tag} class="box" />
    };

    const view = mount(App);
    expect(view.html).toBe('<div class="box"></div>');

    tag.set("section");
    await nextTick();
    expect(view.html).toBe('<section class="box"></section>');
  });

  it("переключает страницы по computed с компонентами", async () => {
    const page = state(0);
    // пропсы объявляются на <Component/>, а не внутри computed
    const current = computed(() =>
      page.value === 1 ? Red : page.value === 2 ? Blue : null,
    );

    const App = () => () => <Component is={current.value} text="раз" />;

    const view = mount(App);
    expect(view.html).toBe("");

    page.set(1);
    await nextTick();
    expect(view.app.querySelector("b")!.textContent).toBe("красный раз");

    page.set(2);
    await nextTick();
    expect(view.app.querySelector("b")).toBeNull();
    expect(view.app.querySelector("i")!.textContent).toBe("синий раз");

    page.set(0);
    await nextTick();
    expect(view.html).toBe("");
  });

  it("не путает проп-функцию с апдейтером при обновлении", async () => {
    const handler = jest.fn();
    const other = jest.fn();
    const flag = state(true);

    const Child = (props: { onPick: () => void }) => () => (
      <button onClick={() => props.onPick()}>ok</button>
    );

    const App = () => () => (
      <Child onPick={flag.value ? handler : other} />
    );

    const view = mount(App);
    view.app.querySelector("button")!.click();
    expect(handler).toHaveBeenCalledTimes(1);

    flag.set(false);
    await nextTick();
    view.app.querySelector("button")!.click();

    expect(other).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("принимает готовый узел", async () => {
    const page = state(0);
    const current = computed(() => {
      if (page.value === 1) return <Red text="раз" />;
      if (page.value === 2) return <Blue text="два" />;
      return null;
    });

    const App = () => () => <Component is={current.value} />;

    const view = mount(App);
    expect(view.html).toBe("");

    page.set(1);
    await nextTick();
    expect(view.app.querySelector("b")!.textContent).toBe("красный раз");

    page.set(2);
    await nextTick();
    expect(view.app.querySelector("b")).toBeNull();
    expect(view.app.querySelector("i")!.textContent).toBe("синий два");
  });

  it("дорисовывает пропсы к готовому узлу", () => {
    const App = () => () => <Component is={<Red text="раз" />} text="два" />;

    // проп с Component перекрывает то, что было на узле
    expect(mount(App).html).toBe("<b>красный два</b>");
  });

  it("ничего не рендерит на пустом is", async () => {
    const current = state<ComponentFn<any> | null>(null);
    const App = () => {
      defineOptions({
        single: true,
      });
      return () => <Component is={current} text="раз" />
    };

    const view = mount(App);
    expect(view.html).toBe("");

    current.set(() => Red);
    await nextTick();
    expect(view.html).toBe("<b>красный раз</b>");
  });
});
