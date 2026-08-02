import { single } from "../../components/component";
import { nextTick, state } from "../../core/reactive";
import { createInstance } from "../../instance";
import { ComponentFn } from "../types";

function mount(Component: ComponentFn<any>) {
  document.body.innerHTML = '<div id="app"></div>';
  const instance = createInstance().rootComponent(Component).mountRoot("#app");
  const app = document.getElementById("app")!;
  return { instance, app };
}

describe("DOM-слой", () => {
  describe("пространства имён", () => {
    it("создаёт svg в правильном namespace", () => {
      const App = () => () => (
        <svg viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" />
        </svg>
      );

      const { app } = mount(App);
      const svg = app.querySelector("svg")!;
      const circle = app.querySelector("circle")!;

      expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(circle.namespaceURI).toBe("http://www.w3.org/2000/svg");
      // регистр camelCase-атрибутов в svg сохраняется
      expect(svg.getAttribute("viewBox")).toBe("0 0 10 10");
    });

    it("возвращает html внутри foreignObject", () => {
      const App = () => () => (
        <svg>
          <foreignObject>
            <div />
          </foreignObject>
        </svg>
      );

      const { app } = mount(App);
      expect(app.querySelector("div")!.namespaceURI).toBe(
        "http://www.w3.org/1999/xhtml",
      );
    });

    it("держит namespace для узлов, созданных позже", async () => {
      const show = state(false);
      const App = () => () => (
        <svg>{show.value && <circle r="1" />}</svg>
      );

      const { app } = mount(App);
      show.set(true);
      await nextTick();

      expect(app.querySelector("circle")!.namespaceURI).toBe(
        "http://www.w3.org/2000/svg",
      );
    });
  });

  describe("class", () => {
    it("собирает из массива и объекта", async () => {
      const active = state(true);
      const App = () => () => (
        <div class={["box", active.value && "active", null]} />
      );

      const { app } = mount(App);
      expect(app.querySelector("div")!.getAttribute("class")).toBe("box active");

      active.set(false);
      await nextTick();
      expect(app.querySelector("div")!.getAttribute("class")).toBe("box");
    });

    it("понимает объектную запись", () => {
      const App = () => () => <div class={{ a: true, b: false, c: 1 }} />;

      const { app } = mount(App);
      expect(app.querySelector("div")!.getAttribute("class")).toBe("a c");
    });

    it("снимает атрибут, когда классов не осталось", async () => {
      const on = state(true);
      const App = () => () => <div class={{ a: on.value }} />;

      const { app } = mount(App);
      on.set(false);
      await nextTick();

      expect(app.querySelector("div")!.hasAttribute("class")).toBe(false);
    });
  });

  describe("style", () => {
    it("применяет объект и снимает исчезнувшие свойства", async () => {
      const wide = state(true);
      const App = () => () => (
        <div style={wide.value ? { width: "10px", color: "red" } : { color: "blue" }} />
      );

      const { app } = mount(App);
      const el = app.querySelector("div") as HTMLElement;
      expect(el.style.width).toBe("10px");
      expect(el.style.color).toBe("red");

      wide.set(false);
      await nextTick();

      expect(el.style.width).toBe("");
      expect(el.style.color).toBe("blue");
    });

    it("переводит camelCase и поддерживает css-переменные", () => {
      const App = () => () => (
        <div style={{ backgroundColor: "red", "--gap": "4px" }} />
      );

      const { app } = mount(App);
      const el = app.querySelector("div") as HTMLElement;

      expect(el.style.backgroundColor).toBe("red");
      expect(el.style.getPropertyValue("--gap")).toBe("4px");
    });
  });

  describe("свойства формы", () => {
    it("пишет value в DOM-свойство, а не в атрибут", async () => {
      const text = state("привет");
      const App = single(() => () => <input value={text} />);

      const { app } = mount(App);
      const input = app.querySelector("input") as HTMLInputElement;
      expect(input.value).toBe("привет");

      text.set("пока");
      await nextTick();
      expect(input.value).toBe("пока");
    });

    it("переключает checked", async () => {
      const on = state(false);
      const App = single(() => () => <input type="checkbox" checked={on} />);

      const { app } = mount(App);
      const input = app.querySelector("input") as HTMLInputElement;
      expect(input.checked).toBe(false);

      on.set(true);
      await nextTick();
      expect(input.checked).toBe(true);
    });

    it("ставит и снимает булев атрибут", async () => {
      const off = state(true);
      const App = () => () => <button disabled={off.value}>ok</button>;

      const { app } = mount(App);
      const button = app.querySelector("button")!;
      expect(button.hasAttribute("disabled")).toBe(true);
      expect(button.getAttribute("disabled")).toBe("");

      off.set(false);
      await nextTick();
      expect(button.hasAttribute("disabled")).toBe(false);
    });

    it("переименовывает className и htmlFor", () => {
      const App = () => () => <label className="l" htmlFor="id" />;

      const { app } = mount(App);
      const label = app.querySelector("label")!;
      expect(label.getAttribute("class")).toBe("l");
      expect(label.getAttribute("for")).toBe("id");
    });
  });

  describe("события", () => {
    it("снимает старый обработчик при замене", async () => {
      const first = jest.fn();
      const second = jest.fn();
      const flag = state(true);

      const App = () => () => (
        <button onClick={flag.value ? first : second}>ok</button>
      );

      const { app } = mount(App);
      const button = app.querySelector("button")!;
      button.click();
      expect(first).toHaveBeenCalledTimes(1);

      flag.set(false);
      await nextTick();
      button.click();

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("поддерживает фазу перехвата", () => {
      const order: string[] = [];
      const App = () => () => (
        <div onClickCapture={() => order.push("родитель")}>
          <button onClick={() => order.push("кнопка")}>ok</button>
        </div>
      );

      const { app } = mount(App);
      app.querySelector("button")!.click();

      expect(order).toStrictEqual(["родитель", "кнопка"]);
    });

    it("принимает опции слушателя", () => {
      const handler = jest.fn();
      const App = () => () => (
        <button onClick={[handler, { once: true }]}>ok</button>
      );

      const { app } = mount(App);
      const button = app.querySelector("button")!;
      button.click();
      button.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("отцепляет обработчик при размонтировании", () => {
      const handler = jest.fn();
      const App = () => () => <button onClick={handler}>ok</button>;

      const { app, instance } = mount(App);
      const button = app.querySelector("button")!;
      instance.unmount();
      button.click();

      expect(handler).toHaveBeenCalledTimes(0);
    });
  });

  describe("ref", () => {
    it("отдаёт узел в функцию и обнуляет при размонтировании", () => {
      const ref = jest.fn();
      const App = () => () => <div ref={ref} />;

      const { app, instance } = mount(App);
      expect(ref).toHaveBeenCalledWith(app.querySelector("div"));

      instance.unmount();
      expect(ref).toHaveBeenLastCalledWith(null);
    });

    it("кладёт узел в сигнал", () => {
      const el = state<Element | null>(null);
      const App = () => () => <div ref={el} />;

      const { app } = mount(App);
      expect(el.peek()).toBe(app.querySelector("div"));
    });

    it("не попадает в атрибуты", () => {
      const App = () => () => <div ref={() => {}} />;

      const { app } = mount(App);
      expect(app.querySelector("div")!.hasAttribute("ref")).toBe(false);
    });
  });

  describe("удаление пропсов", () => {
    it("снимает атрибут, которого больше нет", async () => {
      const withTitle = state(true);
      const App = () => () =>
        withTitle.value ? <div title="t" id="x" /> : <div id="x" />;

      const { app } = mount(App);
      expect(app.querySelector("div")!.getAttribute("title")).toBe("t");

      withTitle.set(false);
      await nextTick();

      const div = app.querySelector("div")!;
      expect(div.hasAttribute("title")).toBe(false);
      expect(div.getAttribute("id")).toBe("x");
    });
  });
});
