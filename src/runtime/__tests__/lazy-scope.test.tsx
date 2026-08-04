import { effectScope, nextTick, state } from "../../core/reactive/index.js";
import { createView, mountChild } from "../mount.js";
import { BaseView } from "../views/base.js";

/** Область создаётся лениво — заглядываем в приватное поле напрямую. */
function hasScope(view: unknown): boolean {
  return (view as unknown as { ownScope: unknown }).ownScope !== null;
}

function container() {
  document.body.innerHTML = '<div id="app"></div>';
  return document.getElementById("app")!;
}

describe("ленивая EffectScope", () => {
  it("текстовый узел не создаёт область", () => {
    const app = container();
    const view = createView("привет");

    view.mount(app, null);
    expect(hasScope(view)).toBe(false);

    view.update("пока");
    expect(app.textContent).toBe("пока");
    expect(hasScope(view)).toBe(false);

    view.unmount();
    expect(hasScope(view)).toBe(false);
  });

  it("статический элемент с детьми тоже обходится без области", () => {
    const app = container();
    const view = mountChild(<div class="box">текст</div>, app);

    expect(app.innerHTML).toBe('<div class="box">текст</div>');
    expect(hasScope(view)).toBe(false);
  });

  it("реактивный проп материализует область", () => {
    const app = container();
    const title = state("раз");
    const view = mountChild(<div title={title}>текст</div>, app);

    expect(hasScope(view)).toBe(true);
    expect(app.innerHTML).toBe('<div title="раз">текст</div>');
  });

  it("область встаёт в родительскую ветку и гаснет вместе с ней", async () => {
    const app = container();
    const title = state("раз");
    const root = effectScope(true);

    // между корнем и реактивным пропом — два «ленивых» уровня без эффектов
    root.run(() =>
      mountChild(
        <section>
          <div>
            <span title={title}>текст</span>
          </div>
        </section>,
        app,
      ),
    );

    const el = app.querySelector("span")!;
    title.value = "два";
    await nextTick();
    expect(el.getAttribute("title")).toBe("два");

    // остановка корня должна погасить эффект, созданный через ленивую цепочку
    root.stop();
    title.value = "три";
    await nextTick();
    expect(el.getAttribute("title")).toBe("два");
  });

  it("после unmount область не воскресает", () => {
    const app = container();
    const view = mountChild(<div>текст</div>, app) as BaseView;

    view.unmount();
    expect(hasScope(view)).toBe(false);

    // повторное обновление не должно создать живую область
    view.update(<div>другое</div>);
    expect(hasScope(view)).toBe(false);
  });
});
