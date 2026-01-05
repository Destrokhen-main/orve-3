import { JSX } from "react";
import { RenderComponent } from "../../type";
import { PRIMITIVE } from "../constants";

// TODO переделать
function getDiff(
  obj1: Record<string, any>,
  obj2: Record<string, any>,
): Record<string, any> | undefined {
  const diff: Record<string, any> = {};
  let allNull = true; // Флаг, чтобы отслеживать, все ли значения null

  // Получаем все уникальные ключи из обоих объектов
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of allKeys) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    const hasKey1 = key in obj1;
    const hasKey2 = key in obj2;

    // Если ключ есть только во втором объекте
    if (!hasKey1 && hasKey2) {
      diff[key] = val2;
      allNull = false;
      continue;
    }

    // Если ключ есть только в первом объекте
    if (hasKey1 && !hasKey2) {
      diff[key] = null;
      continue; // null не меняет allNull = true
    }

    // Если ключ есть в обоих объектах
    if (hasKey1 && hasKey2) {
      // Рекурсивно сравниваем вложенные объекты
      if (
        typeof val1 === "object" &&
        val1 !== null &&
        typeof val2 === "object" &&
        val2 !== null &&
        !Array.isArray(val1) &&
        !Array.isArray(val2)
      ) {
        const nestedDiff = getDiff(val1, val2);

        if (nestedDiff !== undefined) {
          diff[key] = nestedDiff;
          allNull = false;
        } else {
          diff[key] = null;
        }
      } else if (!Object.is(val1, val2)) {
        // Если значения разные
        diff[key] = val2;
        allNull = false;
      } else {
        // Если значения одинаковые
        diff[key] = null;
      }
    }
  }

  // Если все значения null или объект пустой, возвращаем undefined
  if (allNull && Object.keys(diff).length > 0) {
    return undefined;
  }

  return Object.keys(diff).length > 0 ? diff : undefined;
}

export function diffRender(
  lastRender: RenderComponent,
  render: RenderComponent,
): "all" | undefined | Record<string, any> {
  if (!lastRender && render !== null) {
    return "all";
  }

  if (
    PRIMITIVE.includes(typeof lastRender) &&
    PRIMITIVE.includes(typeof render)
  ) {
    if (String(render) === String(lastRender)) {
      return undefined;
    }

    return "all";
  }

  if (lastRender === render) {
    return undefined;
  }

  const old = lastRender as JSX.Element;
  const newi = render as JSX.Element;

  if (old.key !== newi.key) {
    return "all";
  }

  return getDiff(old, newi);
  // проверить что поменялось относительно прошлого рендера
}
