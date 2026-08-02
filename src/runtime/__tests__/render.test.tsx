import { single } from "../../components/component";
import { For, If } from "../../components/component-orve";
import { computed, nextTick, state } from "../../core/reactive";
import { createInstance } from "../../instance";
import { ComponentFn } from "../types";

function mount(Component: ComponentFn<any>) {
  document.body.innerHTML = '<div id="app"></div>';
  const instance = createInstance().rootComponent(Component).mountRoot("#app");
  const app = document.getElementById("app")!;

  return {
    instance,
    app,
    get html() {
      // якоря-комментарии в проверках только мешают
      return app.innerHTML.replace(/<!---->/g, "");
    },
  };
}

describe("рендер", () => {
  describe("базовый режим", () => {
    it("монтирует разметку", () => {
      const App = () => () => (
        <div class="box">
          <span>привет</span>
        </div>
      );

      expect(mount(App).html).toBe('<div class="box"><span>привет</span></div>');
    });

    it("перевызывает render и обновляет текст", async () => {
      const count = state(0);
      const render = jest.fn(() => <span>{count.value}</span>);
      const App = () => render;

      const { html: _, ...view } = mount(App);
      expect(view.app.textContent).toBe("0");
      expect(render).toHaveBeenCalledTimes(1);

      count.set(5);
      await nextTick();

      expect(view.app.textContent).toBe("5");
      expect(render).toHaveBeenCalledTimes(2);
    });

    it("не пересоздаёт DOM-узел при обновлении", async () => {
      const count = state(0);
      const App = () => () => <span>{count.value}</span>;

      const view = mount(App);
      const span = view.app.querySelector("span");

      count.set(1);
      await nextTick();

      expect(view.app.querySelector("span")).toBe(span);
      expect(span!.textContent).toBe("1");
    });

    it("обновляет атрибуты", async () => {
      const cls = state("a");
      const App = () => () => <div class={cls.value} />;

      const view = mount(App);
      expect(view.html).toBe('<div class="a"></div>');

      cls.set("b");
      await nextTick();
      expect(view.html).toBe('<div class="b"></div>');
    });

    it("добавляет и убирает узлы по условию", async () => {
      const flag = state(false);
      const App = () => () => (
        <div>
          {flag.value && <b>да</b>}
        </div>
      );

      const view = mount(App);
      expect(view.app.querySelector("b")).toBeNull();

      flag.set(true);
      await nextTick();
      expect(view.app.querySelector("b")!.textContent).toBe("да");

      flag.set(false);
      await nextTick();
      expect(view.app.querySelector("b")).toBeNull();
    });

    it("переиспользует строки списка по key", async () => {
      const items = state([1, 2, 3]);
      const App = () => () => (
        <ul>
          {items.value.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      );

      const view = mount(App);
      const second = view.app.querySelectorAll("li")[1];

      // порядок меняется, узлы должны переехать, а не пересоздаться
      items.set([3, 2, 1]);
      await nextTick();

      const after = view.app.querySelectorAll("li");
      expect([...after].map((li) => li.textContent)).toStrictEqual(["3", "2", "1"]);
      expect(after[1]).toBe(second);
    });

    it("удаляет исчезнувшие строки", async () => {
      const items = state(["a", "b", "c"]);
      const App = () => () => (
        <ul>
          {items.value.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      );

      const view = mount(App);
      items.set(["a", "c"]);
      await nextTick();

      expect([...view.app.querySelectorAll("li")].map((li) => li.textContent)).toStrictEqual(
        ["a", "c"],
      );
    });

    it("вешает обработчики событий", () => {
      const clicked = jest.fn();
      const App = () => () => <button onClick={clicked}>+</button>;

      const view = mount(App);
      view.app.querySelector("button")!.click();

      expect(clicked).toHaveBeenCalledTimes(1);
    });

    it("не перезапускает setup дочернего компонента", async () => {
      const setup = jest.fn();
      const count = state(0);

      const Child = (props: { value: number }) => {
        setup();
        return () => <i>{props.value}</i>;
      };
      const App = () => () => (
        <div>
          <Child value={count.value} />
        </div>
      );

      const view = mount(App);
      expect(setup).toHaveBeenCalledTimes(1);

      count.set(7);
      await nextTick();

      expect(view.app.querySelector("i")!.textContent).toBe("7");
      expect(setup).toHaveBeenCalledTimes(1);
    });
  });

  describe("сингл режим", () => {
    it("вызывает render один раз и правит текст точечно", async () => {
      const count = state(0);
      const render = jest.fn(() => <span>{count}</span>);
      const App = single(() => render);

      const view = mount(App);
      expect(view.app.textContent).toBe("0");

      count.set(3);
      await nextTick();

      expect(view.app.textContent).toBe("3");
      expect(render).toHaveBeenCalledTimes(1);
    });

    it("понимает computed и тонк", async () => {
      const count = state(2);
      const double = computed(() => count.value * 2);
      const App = single(() => () => (
        <div>
          <i>{double}</i>
          <b>{() => `#${count.value}`}</b>
        </div>
      ));

      const view = mount(App);
      expect(view.app.querySelector("i")!.textContent).toBe("4");
      expect(view.app.querySelector("b")!.textContent).toBe("#2");

      count.set(5);
      await nextTick();

      expect(view.app.querySelector("i")!.textContent).toBe("10");
      expect(view.app.querySelector("b")!.textContent).toBe("#5");
    });

    it("привязывает реактивный атрибут", async () => {
      const count = state(0);
      const App = single(() => () => (
        <div class={() => (count.value > 0 ? "hot" : "cold")} />
      ));

      const view = mount(App);
      expect(view.html).toBe('<div class="cold"></div>');

      count.set(1);
      await nextTick();
      expect(view.html).toBe('<div class="hot"></div>');
    });

    it("If переключает поддерево", async () => {
      const visible = state(false);
      const App = single(() => () => (
        <div>
          <If
            when={visible}
            then={() => <b>есть</b>}
            else={() => <i>нет</i>}
          />
        </div>
      ));

      const view = mount(App);
      expect(view.app.querySelector("i")!.textContent).toBe("нет");

      visible.set(true);
      await nextTick();

      expect(view.app.querySelector("b")!.textContent).toBe("есть");
      expect(view.app.querySelector("i")).toBeNull();
    });

    it("If принимает условие тонком", async () => {
      const count = state(0);
      const App = single(() => () => (
        <If
          when={() => count.value > 1}
          then={() => <b>много</b>}
          else={() => <i>мало</i>}
        />
      ));

      const view = mount(App);
      expect(view.app.querySelector("i")!.textContent).toBe("мало");

      count.set(2);
      await nextTick();
      expect(view.app.querySelector("b")!.textContent).toBe("много");
    });

    it("For принимает список тонком", async () => {
      const items = state(["a"]);
      const App = single(() => () => (
        <ul>
          <For each={() => items.value}>
            {(item: string, index: number) => <li key={index}>{item}</li>}
          </For>
        </ul>
      ));

      const view = mount(App);
      expect(view.app.querySelectorAll("li").length).toBe(1);

      items.set((list) => [...list, "b"]);
      await nextTick();
      expect(view.app.querySelectorAll("li").length).toBe(2);
    });

    it("For рендерит и обновляет список", async () => {
      const items = state(["a", "b"]);
      const App = single(() => () => (
        <ul>
          <For each={items}>
            {(item: string, index: number) => <li key={index}>{item}</li>}
          </For>
        </ul>
      ));

      const view = mount(App);
      expect([...view.app.querySelectorAll("li")].map((li) => li.textContent)).toStrictEqual(
        ["a", "b"],
      );

      items.set((list) => [...list, "c"]);
      await nextTick();

      expect([...view.app.querySelectorAll("li")].map((li) => li.textContent)).toStrictEqual(
        ["a", "b", "c"],
      );
    });
  });

  describe("стык режимов", () => {
    it("базовый родитель обновляет пропсы сингл-ребёнка", async () => {
      const render = jest.fn();
      const count = state(0);

      const Badge = single((props: { count: number }) => {
        return () => {
          render();
          return <span>{() => `x${props.count}`}</span>;
        };
      });

      const App = () => () => (
        <div>
          <Badge count={count.value} />
        </div>
      );

      const view = mount(App);
      expect(view.app.textContent).toBe("x0");

      count.set(4);
      await nextTick();

      // ребёнок не перерендерился, но текст обновился
      expect(view.app.textContent).toBe("x4");
      expect(render).toHaveBeenCalledTimes(1);
    });

    it("сингл-родитель передаёт сигнал базовому ребёнку", async () => {
      const items = state(["a"]);

      const Rows = (props: { items: string[] }) => {
        return () => <ul>{props.items.map((row, i) => <li key={i}>{row}</li>)}</ul>;
      };
      const App = single(() => () => <Rows items={items} />);

      const view = mount(App);
      expect(view.app.querySelectorAll("li").length).toBe(1);

      items.set((list) => [...list, "b"]);
      await nextTick();

      expect(view.app.querySelectorAll("li").length).toBe(2);
    });
  });

  describe("размонтирование", () => {
    it("гасит эффекты компонента", async () => {
      const count = state(0);
      const render = jest.fn(() => <span>{count.value}</span>);
      const App = () => render;

      const view = mount(App);
      view.instance.unmount();

      expect(view.app.innerHTML).toBe("");

      count.set(1);
      await nextTick();
      expect(render).toHaveBeenCalledTimes(1);
    });

    it("гасит эффекты удалённой строки списка", async () => {
      const visible = state(true);
      const count = state(0);
      const bind = jest.fn(() => String(count.value));

      const Row = single(() => () => <span>{bind}</span>);
      const App = single(() => () => (
        <div>
          <If when={visible} then={() => <Row />} />
        </div>
      ));

      const view = mount(App);
      expect(bind).toHaveBeenCalledTimes(1);

      visible.set(false);
      await nextTick();
      expect(view.app.querySelector("span")).toBeNull();

      count.set(1);
      await nextTick();
      // эффект слота удалённой строки больше не должен срабатывать
      expect(bind).toHaveBeenCalledTimes(1);
    });
  });
});
