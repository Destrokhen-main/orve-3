import { ComponentFn, Props } from "../../runtime/types";

const SINGLE = Symbol("orve.single");

/**
 * Пометить компонент как сингл: его render вызывается один раз,
 * дальше DOM правится точечно по сигналам, попавшим в дерево.
 *
 * В сингле в слотах пишут сам сигнал (`{count}`) или тонк (`{() => expr}`) —
 * `{count.value}` вычислится один раз и застынет.
 */
export function single<P extends Props>(fn: ComponentFn<P>): ComponentFn<P> {
  (fn as any)[SINGLE] = true;
  return fn;
}

export function isSingle(fn: ComponentFn<any>) {
  return (fn as any)[SINGLE] === true;
}
