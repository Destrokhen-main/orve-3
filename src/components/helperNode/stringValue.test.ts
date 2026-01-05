import { stringValue } from "./stringValue";

describe("StringValue", () => {
  it("number", () => {
    expect(stringValue(1)).toBe("1");
  });
  it("string", () => {
    expect(stringValue("1")).toBe("1");
  });
  it("object", () => {
    expect(stringValue({ a: 1 })).toBe('{"a":1}');
  });
  it("array", () => {
    expect(stringValue([1, 2, 3])).toBe("[1,2,3]");
  });
});
