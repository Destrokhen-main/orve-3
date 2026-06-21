export function createElement(
  tag: string,
  namespace?: "svg" | "mathtml",
  isCustomizedBuiltInt?: string,
) {
  let el;
  if (namespace === "svg") {
    el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  if (namespace === "mathtml") {
    el = document.createElementNS("http://www.w3.org/1998/Math/MathML", tag);
  }

  if (isCustomizedBuiltInt) {
    const optionsCustomized = {
      is: isCustomizedBuiltInt,
    };

    el = document.createElement(tag, optionsCustomized);
  }

  el = document.createElement(tag);
  // TODO miltiple для select, хз мб нужен будет
  return el;
}
