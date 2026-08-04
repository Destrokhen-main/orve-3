import { defineOptions } from "../..";
import type { Computed, State } from "../../core/reactive";
import { isVNode, jsx } from "../../runtime/jsx";
import { ComponentFn, Props, VNode } from "../../runtime/types";

/**
 * Что рендерить: компонент, имя тега, уже готовый JSX-узел или ничего.
 * `any` в пропсах намеренно: цель динамическая, сузить её здесь нечем,
 * а `ComponentFn<Props>` из-за контрвариантности не примет ни один
 * компонент с конкретными пропсами.
 */
export type DynamicTarget =
  | ComponentFn<any>
  | string
  | VNode
  | null
  | undefined;

export type ComponentProps = {
  /**
   * Компонент (`is={Card}`), имя тега (`is="section"`), готовый узел
   * (`is={<Card />}`) или сигнал с любым из этого.
   *
   * Тонк здесь принципиально невозможен: компонент — сам функция, и отличить
   * `is={Card}` от `is={() => Card}` нельзя. Для вычисляемого выбора нужен
   * `computed`: `is={computed(() => flag.value ? A : B)}`.
   */
  is: DynamicTarget | State<any> | Computed<any>;
  /** Остальное уезжает внутрь `is`; проверить его типами нельзя — цель динамическая. */
  [prop: string]: unknown;
};

/** Все пропы, кроме служебного `is`, уезжают внутрь как есть. */
function forward(props: Props): Props {
  const forwarded: Props = {};

  for (const key of Object.keys(props)) {
    if (key === "is") {
      continue;
    }
    forwarded[key] = props[key];
  }

  return forwarded;
}

/**
 * Динамический компонент: что рендерить, решает проп `is`, и он может меняться.
 *
 *   <Component is={current} text={value} />
 *
 * Возвращает тонк, поэтому `is` и пробрасываемые пропы читаются внутри
 * реактивного слота:
 *   - сменился `is` — старый компонент размонтируется вместе со своей областью
 *     эффектов, новый встаёт на его место;
 *   - `is` тот же, изменились пропы — компонент остаётся жив, `setup` не
 *     перезапускается, обновляются только ячейки пропсов.
 *
 * `is` принимает и строку — тогда рендерится обычный тег, — и уже готовый
 * узел: `computed`, возвращающий `<Card />`, кладётся в `is` как есть.
 */
const Dynamic = (props: ComponentProps) => {
  defineOptions({
    single: true,
  });

  return () => () => {
    // без resolve: функция здесь — это сам компонент, а не тонк
    const target = props.is as DynamicTarget;

    if (!target) {
      return null;
    }

    const forwarded = forward(props);

    // готовый узел: дорисовываем к нему пропсы, если они есть
    if (isVNode(target)) {
      if (Object.keys(forwarded).length === 0) {
        return target;
      }
      return jsx(target.type, { ...target.props, ...forwarded }, target.key);
    }

    return jsx(target, forwarded);
  };
};

export const Component = Dynamic as ComponentFn<ComponentProps>;
