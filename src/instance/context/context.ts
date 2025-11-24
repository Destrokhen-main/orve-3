export let cxt: Record<string, unknown> | null = null;

export function setContext(_cxt: Record<string, unknown> | null) {
  cxt = _cxt;
}