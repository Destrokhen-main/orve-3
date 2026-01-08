const camelToSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export function objectToCss(obj: Record<string, any>): string {
  let o = "";

  Object.keys(obj).forEach((k) => {
    const nk = camelToSnakeCase(k);
    o += `${nk}:${obj[k]};`;
  });

  return o;
}
