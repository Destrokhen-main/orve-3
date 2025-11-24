export function isContextAvailable(cxt: null | Record<string | symbol, unknown>): cxt is Record<string | symbol, unknown> {
  return !!cxt
}