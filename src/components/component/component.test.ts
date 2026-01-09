/**
 * @jest-environment jsdom
 */
import { nextTick } from "../../core/reactive/core";
import { state } from "../../core/reactive/state";
import { componentInstance } from "./component";
import { JSX } from "react";

function render(type: any, props: any, key: string | null): JSX.Element {
  return {
    type,
    props,
    key,
  };
}

describe.skip("Component functions render", () => {
  const root = document.createElement("div");
  document.body.appendChild(root);

  beforeEach(() => {
    root.innerHTML = "";
  });

  async function setup(Comp: any) {
    const component = componentInstance(Comp, { levelRender: 1 });
    component.setup({});
    component.mounted(root);
  }

  it("string", async () => {
    const Comp = () => {
      return () => "text";
    };

    setup(Comp);
    expect(document.body).toMatchSnapshot();
  });

  it("number", async () => {
    const Comp = () => {
      return () => 1;
    };

    setup(Comp);
    expect(document.body).toMatchSnapshot();
  });

  it("string state", async () => {
    let a: any;
    const Comp = () => {
      a = state("hello");

      return () => a.get();
    };

    setup(Comp);
    expect(document.body).toMatchSnapshot();
    a.set("hello world");
    await nextTick();
    expect(document.body).toMatchSnapshot();
  });

  it("number state", async () => {
    let a: any;
    const Comp = () => {
      a = state(1);

      return () => a.get();
    };

    setup(Comp);
    expect(document.body).toMatchSnapshot();
    a.set(2);
    await nextTick();
    expect(document.body).toMatchSnapshot();
  });
});

describe.skip("Component single render", () => {
  const root = document.createElement("div");
  document.body.appendChild(root);

  beforeEach(() => {
    root.innerHTML = "";
  });

  function setup(Comp: any) {
    const component = componentInstance(Comp, { levelRender: 1 });
    component.setup({});
    component.mounted(root);
  }

  it("string", async () => {
    const Comp = () => {
      return "1";
    };

    setup(Comp);
    expect(document.body).toMatchSnapshot();
  });

  it("number", async () => {
    const Comp = () => {
      return 1;
    };

    setup(Comp);
    expect(document.body).toMatchSnapshot();
  });

  it("sting state", async () => {
    let a: any;
    const Comp = () => {
      a = state("1");
      return a;
    };

    setup(Comp);
    expect(document.body).toMatchSnapshot();
    a.set("2");
    await nextTick();
    expect(document.body).toMatchSnapshot();
  });

  it("number state", async () => {
    let a: any;
    const Comp = () => {
      a = state(1);
      return a;
    };

    setup(Comp);
    expect(document.body).toMatchSnapshot();
    a.set(2);
    await nextTick();
    expect(document.body).toMatchSnapshot();
  });
});
