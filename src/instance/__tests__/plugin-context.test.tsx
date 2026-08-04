import { Component } from "../../components/component-orve/index.js";
import { computed, state } from "../../core/reactive/index.js";
import { ComponentFn } from "../../runtime/types.js";
import { defineOptions } from "../context/defines/defineOptions.js";
import { createInstance } from "../index.js";
import { usePlugin, usePlugins } from "../plugins/usePlugins.js";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function mount(App: ComponentFn<any>, use?: (i: ReturnType<typeof createInstance>) => void) {
  document.body.innerHTML = '<div id="app"></div>';
  const instance = createInstance();
  use?.(instance);
  instance.rootComponent(App).mountRoot("#app");
  return { instance, app: document.getElementById("app")! };
}

describe("плагины в setup", () => {
  it("корневой компонент видит плагины инстанса", () => {
    let seen: unknown;

    const App = () => {
      seen = usePlugins().$a;
      return () => <b>ок</b>;
    };

    mount(App, (i) => i.use({ setup: (cx) => void (cx.$a = 1) }));

    expect(seen).toBe(1);
  });

  it("плагины наследуются вложенными компонентами", () => {
    let seen: unknown;

    const Child = () => {
      seen = usePlugin("$b");
      return () => <i>дитя</i>;
    };

    const App = () => () => <Component is={Child} />;

    mount(App, (i) => {
      i.use({ setup: (cx) => void (cx.$a = 1) });
      i.use({ setup: (cx) => void (cx.$b = (cx.$a as number) + 1) });
    });

    expect(seen).toBe(2);
  });

  it("плагины доступны компоненту, поднятому после смены is", async () => {
    const seen: unknown[] = [];

    const First = () => {
      seen.push(usePlugin("$a"));
      return () => <b>первый</b>;
    };
    const Second = () => {
      seen.push(usePlugin("$a"));
      return () => <b>второй</b>;
    };

    const page = state(1);

    const App = () => {
      defineOptions({ single: true });
      const current = computed(() => (page.value === 1 ? First : Second));
      return () => <Component is={current} />;
    };

    mount(App, (i) => i.use({ setup: (cx) => void (cx.$a = 42) }));

    page.set(2);
    await flush();

    expect(seen).toEqual([42, 42]);
  });

  it("вне setup возвращает пустой контекст и предупреждает", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(usePlugins()).toStrictEqual({});
    expect(usePlugin("$a")).toBeUndefined();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
