import { createInstance, OrveInstance } from "../index.js";

describe("plugin architecture", () => {
  let instance: OrveInstance;
  const error = jest.fn();
  const warn = jest.fn();

  beforeAll(() => {
    console.error = error;
    console.warn = warn;
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    instance = createInstance();
    jest.clearAllMocks();
  });

  const mount = () =>
    instance.rootComponent(() => () => "ok").mountRoot("#app");

  it("принимает плагин функцией", () => {
    instance.use((cx) => {
      cx.$a = 1;
    });

    expect(instance._getPlugins()).toStrictEqual({ $a: 1 });
  });

  it("прокидывает options в setup", () => {
    instance.use<{ base: number }>(
      {
        name: "counter",
        setup(cx, api) {
          cx.$count = api.options.base + 1;
        },
      },
      { base: 41 },
    );

    expect(instance._getPlugins()).toStrictEqual({ $count: 42 });
  });

  it("provide() кладёт значение в контекст", () => {
    instance.use((_, api) => {
      api.provide("$router", "router");
    });

    expect(instance._getPlugins()).toStrictEqual({ $router: "router" });
  });

  it("не ставит один и тот же плагин дважды", () => {
    const plugin = {
      name: "dup",
      setup(cx: Record<string, unknown>) {
        cx.$n = ((cx.$n as number) ?? 0) + 1;
      },
    };

    instance.use(plugin).use(plugin);

    expect(instance._getPlugins()).toStrictEqual({ $n: 1 });
    expect(warn).toHaveBeenCalled();
  });

  it("не ставит второй плагин с тем же именем", () => {
    instance.use({ name: "same", setup: (cx) => void (cx.$a = 1) });
    instance.use({ name: "same", setup: (cx) => void (cx.$a = 2) });

    expect(instance._getPlugins()).toStrictEqual({ $a: 1 });
  });

  it("api.has() видит ранее установленные плагины", () => {
    const seen: boolean[] = [];

    instance.use({ name: "first", setup: () => {} });
    instance.use((_, api) => {
      seen.push(api.has("first"), api.has("missing"));
    });

    expect(seen).toStrictEqual([true, false]);
  });

  it("onMounted вызывается после монтирования дерева", () => {
    const onMounted = jest.fn();

    instance.use((_, api) => api.onMounted(onMounted));
    expect(onMounted).not.toHaveBeenCalled();

    mount();
    expect(onMounted).toHaveBeenCalledTimes(1);
  });

  it("плагин, поставленный после mountRoot, получает onMounted сразу", () => {
    const onMounted = jest.fn();

    mount();
    instance.use((_, api) => api.onMounted(onMounted));

    expect(onMounted).toHaveBeenCalledTimes(1);
  });

  it("cleanup из setup и onUnmounted идут в обратном порядке", () => {
    const order: string[] = [];

    instance.use({
      name: "a",
      setup: (_, api) => {
        api.onUnmounted(() => order.push("a"));
      },
    });
    instance.use({
      name: "b",
      setup: () => () => order.push("b-cleanup"),
    });

    mount();
    instance.unmount();

    expect(order).toStrictEqual(["b-cleanup", "a"]);
  });

  it("unmount идемпотентен для хуков плагина", () => {
    const onUnmounted = jest.fn();

    instance.use((_, api) => api.onUnmounted(onUnmounted));
    mount();
    instance.unmount();
    instance.unmount();

    expect(onUnmounted).toHaveBeenCalledTimes(1);
  });

  it("падение setup не пропускает частичные изменения в контекст", () => {
    instance.use({ name: "ok", setup: (cx) => void (cx.$a = 1) });
    instance.use({
      name: "bad",
      setup(cx) {
        cx.$b = 2;
        throw new Error("boom");
      },
    });

    expect(instance._getPlugins()).toStrictEqual({ $a: 1 });
    expect(error).toHaveBeenCalled();
  });

  it("ошибка в onMounted не мешает остальным хукам", () => {
    const after = jest.fn();

    instance.use({
      name: "bad",
      setup: (_, api) =>
        api.onMounted(() => {
          throw new Error("boom");
        }),
    });
    instance.use({ name: "good", setup: (_, api) => api.onMounted(after) });

    mount();

    expect(after).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalled();
  });
});
