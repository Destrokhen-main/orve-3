import { JSX } from "react";
import { nextTick } from "../../core/reactive/core";
import { state } from "../../core/reactive/state";
import { ComponentFn } from "./component.fn";
import { FRAGMENT } from "./constants";

function render(type: any, props: any, key: string | null = null): JSX.Element {
  return {
    type,
    props,
    key,
  };
}

describe("Component FN", () => {
  const root = document.createElement("div");
  document.body.appendChild(root);

  function setup(fn: () => any) {
    const render = new ComponentFn(fn);
    render.mounted(root);
  }

  beforeEach(() => {
    root.innerHTML = "";
  });

  describe("simple", () => {
    beforeEach(() => {
      root.innerHTML = "";
    });

    it("should render text", () => {
      const fn = () => "text";
      setup(fn);
      expect(document.body.innerHTML).toBe("<div>text</div>");
    });

    it("should render state", async () => {
      const a = state("text");
      const fn = () => a.get();
      setup(fn);
      expect(document.body.innerHTML).toBe("<div>text</div>");
      a.set("hello");
      await nextTick();
      expect(document.body.innerHTML).toBe("<div>hello</div>");
    });

    it("should render state number", async () => {
      const a = state(1);
      const fn = () => a.get();
      setup(fn);
      expect(document.body.innerHTML).toBe("<div>1</div>");
      a.set(a.get() + 1);
      await nextTick();
      expect(document.body.innerHTML).toBe("<div>2</div>");
    });

    it("should set empty div", async () => {
      const a = state(1);
      const fn = () => (a.get() === 1 ? "yes" : null);
      setup(fn);
      expect(document.body.innerHTML).toBe("<div>yes</div>");
      a.set(a.get() + 1);
      await nextTick();
      expect(document.body.innerHTML).toBe("<div></div>");
    });

    it("should set value start with null", async () => {
      const a = state(1);
      const fn = () => (a.get() === 1 ? null : "yes");
      setup(fn);
      expect(document.body.innerHTML).toBe("<div></div>");
      a.set(a.get() + 1);
      await nextTick();
      expect(document.body.innerHTML).toBe("<div>yes</div>");
    });
  });

  describe("mone one node", () => {
    beforeEach(() => {
      root.innerHTML = "";
    });

    it("should render 2 node", () => {
      setup(() =>
        render(FRAGMENT, {
          children: [
            render("p", { children: "text-1" }),
            render("p", { children: "text-2" }),
          ],
        }),
      );
      expect(document.body.innerHTML).toBe(
        "<div><p>text-1</p><p>text-2</p></div>",
      );
    });

    it("should correct render node -> textNode", async () => {
      const a = state(true);
      setup(() => {
        return a.get() ? render("p", { children: "text" }) : null;
      });
      expect(document.body.innerHTML).toBe("<div><p>text</p></div>");
      a.set(false);
      await nextTick();
      expect(document.body.innerHTML).toBe("<div></div>");
    });
    // it("should render node", async () => {
    //   const a = state("text-1");
    //   setup(() =>
    //     render("div", {
    //       children: [
    //         render("span", { children: a.get() }),
    //         render("span", { children: "text-2" }),
    //       ],
    //     }),
    //   );
    //   a.set("text-2");
    //   await nextTick();

    //   expect(document.body.innerHTML).toBe(
    //     "<div><div><span>text-2</span><span>text-2</span></div></div>",
    //   );
    // });

    // it.only("should render node", async () => {
    //   const a = state(true);
    //   setup(() =>
    //     render("div", {
    //       children: [
    //         a.get() ? render("span", { children: "text-1" }) : "text-2",
    //       ],
    //     }),
    //   );
    //   a.set(false);
    //   await nextTick();

    //   expect(document.body.innerHTML).toBe("<div><div>text-2</div></div>");
    // });
  });
});
