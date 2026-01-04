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
  it("1", async () => {
    const testComponent = async () => {
      return render(
        "div",
        {
          children: [
            render(
              () => {
                return "string";
              },
              {},
              null,
            ),
            "qwe",
          ],
        },
        null,
      );
    };

    const component = componentInstance(testComponent, { levelRender: 1 });
    await component.setup({});
    console.log(component.getChildren());
  });
});
