import { nextTick } from "../../core/reactive/core";
import { state } from "../../core/reactive/state";
import { TextNode } from "./index";

describe("TextNode", () => {
  const root = document.createElement("div");
  document.body.appendChild(root);

  beforeEach(() => {
    root.innerHTML = "";
  });

  it("string", () => {
    const textNode = new TextNode("text");
    textNode.mounted(root);

    expect(root.innerHTML).toBe("text");
  });

  it("unmounted", () => {
    const textNode = new TextNode("text");
    textNode.mounted(root);
    textNode.unMounted();

    expect(root.innerHTML).toBe("");
  });

  it("number", () => {
    const textNode = new TextNode(1);
    textNode.mounted(root);

    expect(root.innerHTML).toBe("1");
  });

  it("state", async () => {
    const a = state("hello");
    const textNode = new TextNode(a);
    textNode.mounted(root);
    expect(root.innerHTML).toBe("hello");

    a.set("hello world");
    await nextTick();
    expect(root.innerHTML).toBe("hello world");
  });

  it("object", async () => {
    const a = state({ a: 1 });
    const textNode = new TextNode(a);
    textNode.mounted(root);
    expect(root.innerHTML).toBe('{"a":1}');

    a.set({ b: 1 });
    await nextTick();
    expect(root.innerHTML).toBe('{"b":1}');
  });

  it("array", async () => {
    const a = state([1, 2, 3]);
    const textNode = new TextNode(a);
    textNode.mounted(root);
    expect(root.innerHTML).toBe("[1,2,3]");

    a.set([1, 2, 3, 4]);
    await nextTick();
    expect(root.innerHTML).toBe("[1,2,3,4]");
  });
});
