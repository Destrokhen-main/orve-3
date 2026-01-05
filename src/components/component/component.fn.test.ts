import { nextTick } from "../../core/reactive/core";
import { state } from "../../core/reactive/state";
import { ComponentFn } from "./component.fn";

describe("Component FN", () => {
  const root = document.createElement("div");
  document.body.appendChild(root);

  describe("simple", () => {
    beforeEach(() => {
      root.innerHTML = "";
    });

    function setup(fn: () => any) {
      const render = new ComponentFn(fn);
      render.mounted(root);
    }

    it("should render text", () => {
      const fn = () => "text";
      setup(fn);
      expect(document.body.innerHTML).toBe("<div>text</div>");
    });

    it("shoudl render state", async () => {
      const a = state("text");
      const fn = () => a.get();
      setup(fn);
      expect(document.body.innerHTML).toBe("<div>text</div>");
      a.set("hello");
      await nextTick();
      expect(document.body.innerHTML).toBe("<div>hello</div>");
    });

    it("shoudl render state number", async () => {
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
});
