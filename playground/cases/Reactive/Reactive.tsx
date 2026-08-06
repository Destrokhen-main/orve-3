import { reactive, state, toRaw } from "orve";

/**
 * Кейс: reactive() — мутации по месту без переприсваивания.
 *
 * Что проверяем:
 *  - push в массив и добавление ключа в объект перерисовывают разметку;
 *  - вложенные объекты реактивны на любой глубине;
 *  - Map: set/delete видны через size и итерацию;
 *  - для сравнения — те же данные в state: мутация по месту не видна,
 *    пока не положить новую ссылку.
 */
export const Reactive = () => {
  const list = reactive<string[]>(["1"]);
  const dict = reactive<Record<string, number>>({ "1": 1 });
  const user = reactive({ profile: { name: "аня", tags: new Set(["новый"]) } });
  const settings = reactive(new Map<string, number>([["theme", 1]]));

  // то же самое, но на сигнале — мутация по месту не разбудит рендер
  const plain = state<string[]>(["1"]);

  return () => (
    <section>
      <h3>reactive</h3>

      <div>
        массив: {list.map((item, i) => <span key={i}>{item} </span>)}
      </div>

      <div>
        объект:{" "}
        {Object.keys(dict).map((key) => (
          <span key={key}>
            {key}={dict[key]}{" "}
          </span>
        ))}
      </div>

      <div>
        вложенное: {user.profile.name}, теги: {[...user.profile.tags].join(", ")}
      </div>

      <div>
        Map (size {settings.size}):{" "}
        {[...settings.entries()].map(([key, value]) => (
          <span key={key}>
            {key}={value}{" "}
          </span>
        ))}
      </div>

      <div>
        <button
          onClick={() => {
            list.push(`${list.length + 1}`);
            dict[Object.keys(dict).length + 1] = 1;
            user.profile.name = user.profile.name === "аня" ? "оля" : "аня";
            user.profile.tags.add(`тег-${user.profile.tags.size}`);
            settings.set(`opt-${settings.size}`, settings.size);
          }}
        >
          мутировать по месту
        </button>
        <button onClick={() => console.log(toRaw(user))}>
          toRaw в консоль
        </button>
      </div>

      <h3>state, для сравнения</h3>

      <div>
        массив: {plain.value.map((item, i) => <span key={i}>{item} </span>)}
      </div>

      <div>
        <button
          onClick={() =>
            plain.set((v) => {
              v.push("1");
              return v;   // та же ссылка — рендер не обновится
            })
          }
        >
          мутировать по месту (не сработает)
        </button>
        <button onClick={() => plain.set((v) => [...v, "1"])}>
          новая ссылка (сработает)
        </button>
      </div>
    </section>
  );
};
