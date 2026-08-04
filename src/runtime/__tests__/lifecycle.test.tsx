import { defineOptions } from "../..";
import {
  onBeforeUnmounted,
  onMounted,
  onUnmounted,
} from "../../components/component";
import { Component, If } from "../../components/component-orve";
import { nextTick, state } from "../../core/reactive";
import { createInstance } from "../../instance";
import { ComponentFn } from "../types";

function mount(App: ComponentFn<any>) {
  document.body.innerHTML = '<div id="app"></div>';
  const instance = createInstance().rootComponent(App).mountRoot("#app");
  return { instance, app: document.getElementById("app")! };
}

describe("хуки жизненного цикла", () => {
  it("onMounted вызывается один раз после отрисовки", () => {
    const hook = jest.fn();

    const App = () => {
      onMounted(hook);
      return () => <b>привет</b>;
    };

    const { app } = mount(App);
    expect(hook).toHaveBeenCalledTimes(1);
    expect(app.querySelector("b")!.textContent).toBe("привет");
  });

  it("к моменту onMounted узлы уже в документе", () => {
    let attached: boolean | null = null;
    let text: string | null = null;

    const Child = () => {
      onMounted(() => {
        const node = document.querySelector("i")!;
        attached = document.body.contains(node);
        text = node.textContent;
      });
      return () => <i>вложенный</i>;
    };

    // ребёнок лежит глубоко: без отложенной очереди его узел
    // в этот момент ещё не был бы вставлен в документ
    const App = () => () => (
      <div>
        <section>
          <Child />
        </section>
      </div>
    );

    mount(App);
    expect(attached).toBe(true);
    expect(text).toBe("вложенный");
  });

  it("дети монтируются раньше родителей", () => {
    const order: string[] = [];

    const Child = () => {
      onMounted(() => order.push("ребёнок"));
      return () => <i />;
    };
    const App = () => {
      onMounted(() => order.push("родитель"));
      return () => (
        <div>
          <Child />
        </div>
      );
    };

    mount(App);
    expect(order).toStrictEqual(["ребёнок", "родитель"]);
  });

  it("не повторяется при обновлении пропсов", async () => {
    const hook = jest.fn();
    const count = state(0);

    const Child = (props: { value: number }) => {
      onMounted(hook);
      return () => <i>{props.value}</i>;
    };
    const App = () => () => <Child value={count.value} />;

    const { app } = mount(App);
    count.set(1);
    await nextTick();

    expect(app.querySelector("i")!.textContent).toBe("1");
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it("работает и в сингл-режиме", () => {
    const hook = jest.fn();
    const App = () => {
      defineOptions({
        single: true,
      });
      onMounted(hook);
      return () => <b />;
    };

    mount(App);
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it("onBeforeUnmounted видит DOM, onUnmounted — уже нет", () => {
    const order: string[] = [];
    let beforeHadNode: boolean | null = null;
    let afterHadNode: boolean | null = null;

    const App = () => {
      onBeforeUnmounted(() => {
        order.push("before");
        beforeHadNode = !!document.querySelector("b");
      });
      onUnmounted(() => {
        order.push("after");
        afterHadNode = !!document.querySelector("b");
      });
      return () => <b>тут</b>;
    };

    const { instance } = mount(App);
    instance.unmount();

    expect(order).toStrictEqual(["before", "after"]);
    expect(beforeHadNode).toBe(true);
    expect(afterHadNode).toBe(false);
  });

  it("срабатывают при снятии через If", async () => {
    const visible = state(true);
    const unmounted = jest.fn();

    const Child = () => {
      onUnmounted(unmounted);
      return () => <i />;
    };
    const App = () => () => {
      defineOptions({
        single: true,
      });
      return <If when={visible} then={() => <Child />} />
    };

    const { app } = mount(App);
    expect(unmounted).toHaveBeenCalledTimes(0);

    visible.set(false);
    await nextTick();

    expect(app.querySelector("i")).toBeNull();
    expect(unmounted).toHaveBeenCalledTimes(1);
  });

  it("срабатывают при смене is у Component", async () => {
    const unmounted = jest.fn();
    const mounted = jest.fn();

    const First = () => {
      onUnmounted(unmounted);
      return () => <b />;
    };
    const Second = () => {
      onMounted(mounted);
      return () => <i />;
    };

    const current = state<ComponentFn<any>>(First);
    const App = () => {
      defineOptions({
        single: true,
      });
      return () => <Component is={current} />
    };

    mount(App);
    expect(unmounted).toHaveBeenCalledTimes(0);

    current.set(() => Second);
    await nextTick();

    expect(unmounted).toHaveBeenCalledTimes(1);
    expect(mounted).toHaveBeenCalledTimes(1);
  });

  it("размонтирование родителя гасит хуки детей", () => {
    const unmounted = jest.fn();

    const Child = () => {
      onUnmounted(unmounted);
      return () => <i />;
    };
    const App = () => () => (
      <div>
        <Child />
        <Child />
      </div>
    );

    const { instance } = mount(App);
    instance.unmount();

    expect(unmounted).toHaveBeenCalledTimes(2);
  });

  it("не срабатывают дважды", () => {
    const unmounted = jest.fn();
    const App = () => {
      onUnmounted(unmounted);
      return () => <b />;
    };

    const { instance } = mount(App);
    instance.unmount();
    instance.unmount();

    expect(unmounted).toHaveBeenCalledTimes(1);
  });

  it("предупреждает при вызове вне setup", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    onMounted(() => {});

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("onMounted вызван вне setup"),
    );
    warn.mockRestore();
  });

  it("ошибка в хуке не ломает соседей", () => {
    const error = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const second = jest.fn();

    const App = () => {
      onMounted(() => {
        throw new Error("бум");
      });
      onMounted(second);
      return () => <b />;
    };

    expect(() => mount(App)).not.toThrow();
    expect(second).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
