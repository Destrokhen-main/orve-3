import { createInstance, nextTick } from "orve";
import { App } from "../components/App.js";
import { historyPlugin } from "../plugins/history.js";
import { shortcutsPlugin } from "../plugins/shortcuts.js";
import { clearDocument, shapes, tool } from "../store/document.js";

/** jsdom не знает про PointerEvent — событию хватает координат мыши. */
function pointer(target: Element, type: string, x: number, y: number) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  target.dispatchEvent(event);
}

describe("Orve Paint", () => {
  let host: HTMLDivElement;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  let instance: ReturnType<ReturnType<typeof createInstance>["mountRoot"]>;

  beforeEach(() => {
    localStorage.clear();
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    error = jest.spyOn(console, "error").mockImplementation(() => {});

    host = document.createElement("div");
    host.id = "app";
    document.body.appendChild(host);

    instance = createInstance()
      .use(historyPlugin)
      .use(shortcutsPlugin)
      .rootComponent(App)
      .mountRoot("#app");
  });

  afterEach(() => {
    instance.unmount();
    host.remove();
    warn.mockRestore();
    error.mockRestore();
  });

  it("монтируется без предупреждений", async () => {
    await nextTick();

    expect(host.querySelector(".canvas__surface")).not.toBeNull();
    expect(host.querySelectorAll(".layer").length).toBe(shapes.peek().length);
    expect(warn.mock.calls).toEqual([]);
    expect(error.mock.calls).toEqual([]);
  });

  it("рисует прямоугольник и складывает его в историю", async () => {
    await nextTick();

    const before = shapes.peek().length;
    const surface = host.querySelector(".canvas__surface")!;

    tool.set("rect");
    await nextTick();

    pointer(surface, "pointerdown", 20, 20);
    pointer(surface, "pointermove", 140, 100);
    pointer(surface, "pointerup", 140, 100);
    await nextTick();

    expect(shapes.peek().length).toBe(before + 1);
    expect(host.querySelectorAll(".layer").length).toBe(before + 1);

    // Ctrl+Z из плагина горячих клавиш
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }),
    );
    await nextTick();

    expect(shapes.peek().length).toBe(before);
    expect(warn.mock.calls).toEqual([]);
  });

  it("переключает вкладки правой колонки через <Component>", async () => {
    await nextTick();

    const tabs = Array.from(host.querySelectorAll<HTMLButtonElement>(".tab"));
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Слои",
      "Свойства",
      "Кисть",
      "Справка",
    ]);

    tabs[3].click();
    await nextTick();

    expect(host.querySelector(".keys")).not.toBeNull();
    expect(host.querySelector(".layers")).toBeNull();
    expect(warn.mock.calls).toEqual([]);
  });

  it("переживает клик по каждой кнопке во всех вкладках", async () => {
    await nextTick();

    const tabs = Array.from(host.querySelectorAll<HTMLButtonElement>(".tab"));

    for (const tab of tabs) {
      tab.click();
      await nextTick();

      const buttons = Array.from(
        host.querySelectorAll<HTMLButtonElement>(".panel button, .rail button"),
      );

      for (const button of buttons) {
        button.click();
        await nextTick();
      }
    }

    expect(warn.mock.calls).toEqual([]);
    expect(error.mock.calls).toEqual([]);
  });

  it("показывает заглушку на пустом холсте", async () => {
    await nextTick();

    clearDocument();
    await nextTick();

    expect(host.querySelector(".layers")).toBeNull();
    expect(host.querySelector(".empty")).not.toBeNull();
  });
});
