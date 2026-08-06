import { defineOptions } from "../../index.js";
import { For } from "../../components/component-orve/index.js";
import { nextTick, reactive } from "../../core/reactive/index.js";
import { createInstance } from "../../instance/index.js";
import { ComponentFn } from "../types.js";

function mount(Component: ComponentFn<any>) {
  document.body.innerHTML = '<div id="app"></div>';
  createInstance().rootComponent(Component).mountRoot("#app");
  const app = document.getElementById("app")!;

  return {
    app,
    get text() {
      return app.textContent;
    },
  };
}

describe("reactive в разметке", () => {
  describe("базовый режим", () => {
    it("мутация поля перерисовывает render", async () => {
      const store = reactive({ name: "аня" });
      const App = () => () => <span>{store.name}</span>;

      const view = mount(App);
      expect(view.text).toBe("аня");

      store.name = "оля";
      await nextTick();
      expect(view.text).toBe("оля");
    });

    it("push в массив перерисовывает список", async () => {
      const list = reactive(["a"]);
      const App = () => () => (
        <ul>
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

      const view = mount(App);
      expect(view.app.querySelectorAll("li")).toHaveLength(1);

      list.push("b");
      await nextTick();
      expect(view.app.querySelectorAll("li")).toHaveLength(2);
    });
  });

  describe("сингл", () => {
    it("тонк со свойством обновляется точечно", async () => {
      const store = reactive({ name: "аня", visits: 0 });
      const render = jest.fn();

      const App = () => {
        defineOptions({ single: true });
        return () => {
          render();
          return (
            <span>
              {() => store.name}:{() => store.visits}
            </span>
          );
        };
      };

      const view = mount(App);
      expect(view.text).toBe("аня:0");

      store.visits = 1;
      await nextTick();
      expect(view.text).toBe("аня:1");

      store.name = "оля";
      await nextTick();
      expect(view.text).toBe("оля:1");

      // render в сингле выполняется ровно один раз
      expect(render).toHaveBeenCalledTimes(1);
    });

    it("For с копией массива следит за мутациями по месту", async () => {
      type Task = { id: number; text: string };
      const list = reactive<Task[]>([{ id: 1, text: "первая" }]);

      const App = () => {
        defineOptions({ single: true });
        return () => (
          <ul>
            <For each={() => [...list]} by={(task) => task.id}>
              {(task) => <li>{() => task.value.text}</li>}
            </For>
          </ul>
        );
      };

      const view = mount(App);
      expect(view.text).toBe("первая");

      list.push({ id: 2, text: "вторая" });
      await nextTick();
      expect(view.app.querySelectorAll("li")).toHaveLength(2);

      // мутация поля внутри строки — обновляется только текст строки
      const firstRow = view.app.querySelector("li")!;
      list[0].text = "правленая";
      await nextTick();
      expect(view.app.querySelector("li")).toBe(firstRow);
      expect(firstRow.textContent).toBe("правленая");

      list.splice(0, 1);
      await nextTick();
      expect(view.text).toBe("вторая");

      list.length = 0;
      await nextTick();
      expect(view.app.querySelectorAll("li")).toHaveLength(0);
    });

    it("For по Map следит за size и составом", async () => {
      const settings = reactive(new Map<string, number>([["theme", 1]]));

      const App = () => {
        defineOptions({ single: true });
        return () => (
          <div>
            <b>{() => settings.size}</b>
            <ul>
              <For each={() => [...settings.entries()]} by={([key]) => key}>
                {(entry) => <li>{() => `${entry.value[0]}=${entry.value[1]}`}</li>}
              </For>
            </ul>
          </div>
        );
      };

      const view = mount(App);
      expect(view.text).toBe("1theme=1");

      settings.set("scale", 2);
      await nextTick();
      expect(view.text).toBe("2theme=1scale=2");

      settings.set("theme", 3);
      await nextTick();
      expect(view.text).toBe("2theme=3scale=2");

      settings.clear();
      await nextTick();
      expect(view.text).toBe("0");
    });
  });
});
