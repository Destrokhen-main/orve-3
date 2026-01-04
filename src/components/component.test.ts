/**
 * @jest-environment jsdom
 */
import { componentInstance } from "./component";
import { Children, JSX } from "react";

function render(type: any, props: any, key: string | null): JSX.Element {
  return {
    type,
    props,
    key,
  };
}

describe("Component", () => {
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.appendChild(root);

  beforeEach(() => {
    root.innerHTML = "";
  });

  it("render <div>test</div>", async () => {
    const testComponent = async () => {
      return render(
        "div",
        {
          children: "test",
        },
        null,
      );
    };

    const component = componentInstance(testComponent, { levelRender: 1 });
    await component.setup({});
    component.mounted(root);
    expect(document.body.children).toMatchSnapshot();
  });
});
