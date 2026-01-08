import { JSX } from "react";
import { Node } from "./index";

describe("Node", () => {
  const root = document.createElement("div");
  document.body.appendChild(root);

  describe("children", () => {
    beforeEach(() => {
      root.innerHTML = "";
    });

    it("default Node", () => {
      const el: JSX.Element = {
        type: "p",
        props: { id: "1", children: "text" },
        key: null,
      };
      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);

      expect(document.body.innerHTML).toBe('<div><p id="1">text</p></div>');
    });

    it("node in node", () => {
      const el: JSX.Element = {
        type: "p",
        props: {
          id: "1",
          children: [
            "text",
            {
              type: "span",
              props: {
                children: "item",
                class: "test",
              },
            },
          ],
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);

      expect(document.body.innerHTML).toBe(
        '<div><p id="1">text<span class="test">item</span></p></div>',
      );
    });

    it("change node children", () => {
      const el: JSX.Element = {
        type: "div",
        props: {
          children: [
            {
              type: "p",
              props: {
                children: "text-1",
              },
            },
            "text-2",
          ],
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);

      expect(document.body.innerHTML).toBe(
        "<div><div><p>text-1</p>text-2</div></div>",
      );
      node.reMounted({
        type: "div",
        props: {
          children: ["text-2", "text-2"],
        },
        key: null,
      });
      expect(document.body.innerHTML).toBe(
        "<div><div>text-2text-2</div></div>",
      );
    });

    it("change textNode to Node", () => {
      const el: JSX.Element = {
        type: "div",
        props: {
          children: ["text-1", "text-2"],
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);

      expect(document.body.innerHTML).toBe(
        "<div><div>text-1text-2</div></div>",
      );

      node.reMounted({
        type: "div",
        props: {
          children: [
            {
              type: "p",
              props: {
                children: "text-1",
              },
            },
            "text-2",
          ],
        },
        key: null,
      });

      expect(document.body.innerHTML).toBe(
        "<div><div><p>text-1</p>text-2</div></div>",
      );
    });

    it("different count Children", () => {
      const el: JSX.Element = {
        type: "div",
        props: {
          children: ["text-1", "text-2"],
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);

      expect(document.body.innerHTML).toBe(
        "<div><div>text-1text-2</div></div>",
      );

      node.reMounted({
        type: "div",
        props: {
          children: ["text-1"],
        },
        key: null,
      });

      expect(document.body.innerHTML).toBe("<div><div>text-1</div></div>");
    });

    it("different count Children (2)", () => {
      const el: JSX.Element = {
        type: "div",
        props: {
          children: ["text-1"],
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);

      expect(document.body.innerHTML).toBe("<div><div>text-1</div></div>");

      node.reMounted({
        type: "div",
        props: {
          children: ["text-1", "text-2"],
        },
        key: null,
      });

      expect(document.body.innerHTML).toBe(
        "<div><div>text-1text-2</div></div>",
      );
    });

    it("change node and diff count children", () => {
      const el: JSX.Element = {
        type: "div",
        props: {
          children: "text-1",
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);

      expect(document.body.innerHTML).toBe("<div><div>text-1</div></div>");

      node.reMounted({
        type: "div",
        props: {
          children: [
            "text-2",
            {
              type: "p",
              props: {
                children: "text-3",
              },
              key: null,
            },
          ],
        },
        key: null,
      });

      expect(document.body.innerHTML).toBe(
        "<div><div>text-2<p>text-3</p></div></div>",
      );
    });
  });

  describe("type", () => {});

  describe("props", () => {
    beforeEach(() => {
      root.innerHTML = "";
    });

    it("change props", () => {
      const el: JSX.Element = {
        type: "p",
        props: {
          id: "test-1",
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);
      expect(document.body.innerHTML).toBe('<div><p id="test-1"></p></div>');

      node.reMounted({
        type: "p",
        props: {
          id: "test-2",
        },
        key: null,
      });
      expect(document.body.innerHTML).toBe('<div><p id="test-2"></p></div>');
    });

    it("change props name", () => {
      const el: JSX.Element = {
        type: "p",
        props: {
          id: "test-1",
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);
      expect(document.body.innerHTML).toBe('<div><p id="test-1"></p></div>');

      node.reMounted({
        type: "p",
        props: {
          class: "test-2",
        },
        key: null,
      });
      expect(document.body.innerHTML).toBe('<div><p class="test-2"></p></div>');
    });

    it("remove all props", () => {
      const el: JSX.Element = {
        type: "p",
        props: {
          class: "test-2",
          id: "asd",
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);
      expect(document.body.innerHTML).toBe(
        '<div><p class="test-2" id="asd"></p></div>',
      );

      node.reMounted({
        type: "p",
        props: {},
        key: null,
      });
      expect(document.body.innerHTML).toBe("<div><p></p></div>");
    });

    it("bool props", () => {
      const el: JSX.Element = {
        type: "p",
        props: {
          id: true,
        },
        key: null,
      };

      const node = new Node(el, { isFnNode: true });
      node.setup();
      node.mounted(root);
      expect(document.body.innerHTML).toBe('<div><p id=""></p></div>');

      node.reMounted({
        type: "p",
        props: {},
        key: null,
      });
      expect(document.body.innerHTML).toBe("<div><p></p></div>");
    });
  });

  describe("key", () => {});
});
