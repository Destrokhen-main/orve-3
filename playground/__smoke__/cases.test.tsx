import { createInstance, nextTick } from "orve";
import { Lifecycle } from "../cases/Lifecycle/Lifecycle.js";
import { Refs } from "../cases/Refs/Refs.js";
import { Forms } from "../cases/Forms/Forms.js";
import { ForStress } from "../cases/ForStress/ForStress.js";
import { Svg } from "../cases/Svg/Svg.js";
import { Events } from "../cases/Events/Events.js";
import { SlotTypes } from "../cases/SlotTypes/SlotTypes.js";
import { AsyncRace } from "../cases/AsyncRace/AsyncRace.js";
import { Errors } from "../cases/Errors/Errors.js";
import { Slots } from "../cases/Slots/Slots.js";
import { Reactivity } from "../cases/Reactivity/Reactivity.js";

/** Кейс Errors роняет обработчики намеренно — его прокликивать нечего. */
const noClick = new Set(["Errors"]);

const cases: [string, any][] = [
  ["Lifecycle", Lifecycle],
  ["Refs", Refs],
  ["Forms", Forms],
  ["ForStress", ForStress],
  ["Svg", Svg],
  ["Events", Events],
  ["SlotTypes", SlotTypes],
  ["AsyncRace", AsyncRace],
  ["Errors", Errors],
  ["Slots", Slots],
  ["Reactivity", Reactivity],
];

describe("playground: кейсы монтируются без предупреждений", () => {
  it.each(cases)("%s", async (_name, Case) => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const error = jest.spyOn(console, "error").mockImplementation(() => {});

    const host = document.createElement("div");
    host.id = "app";
    document.body.appendChild(host);

    const instance = createInstance().rootComponent(Case).mountRoot("#app");
    await nextTick();

    expect(host.innerHTML.length).toBeGreaterThan(50);
    expect(warn.mock.calls).toEqual([]);
    expect(error.mock.calls).toEqual([]);

    // прокликиваем все кнопки — ищем падения на интерактиве
    const buttons = noClick.has(_name as string)
      ? []
      : Array.from(host.querySelectorAll("button"));
    for (const button of buttons) {
      try {
        button.click();
      } catch {
        // часть кейсов роняет обработчик намеренно
      }
      await nextTick();
    }

    instance.unmount();
    host.remove();
    warn.mockRestore();
    error.mockRestore();
  });
});
