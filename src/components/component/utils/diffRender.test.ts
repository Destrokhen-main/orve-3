import { diffRender } from "./diffRender";

describe("diffRender", () => {
  it("lastRender null", () => {
    expect(diffRender(null, "1")).toBe("all");
    expect(diffRender(null, null)).toBe(undefined);
  });

  const cases: {
    params: [
      string | number | Record<string, any>,
      string | number | Record<string, any>,
    ];
    result: "all" | undefined | Record<string, any>;
  }[] = [
    { params: ["1", "2"], result: "all" },
    { params: [1, "2"], result: "all" },
    { params: ["1", "1"], result: undefined },
    { params: [1, "1"], result: undefined },
    {
      params: [
        { type: "div", key: "div" },
        { type: "div", key: "div" },
      ],
      result: undefined,
    },
    { params: [{ type: "div" }, { type: "span" }], result: { type: "span" } },
    {
      params: [
        { type: "div", props: { a: "a", b: "1" } },
        { type: "div", props: { a: "a", b: "1" } },
      ],
      result: undefined,
    },
  ];

  cases.forEach((e) => {
    it(`case "${JSON.stringify(e.params[0])}"-"${JSON.stringify(e.params[1])}" - "${JSON.stringify(e.result)}"`, () => {
      expect(diffRender(...(e.params as [any, any]))).toStrictEqual(e.result);
    });
  });
});
