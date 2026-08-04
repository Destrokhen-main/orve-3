import { defineOptions, For, State, state } from "orve";

type Item = { name: number; state: string };

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const color = (item: Item) => {
  if (item.state === 'progress') return 'yellow';
  if (item.state === 'done') return 'green';
  return 'unset';
}

const request = (done: () => void) => {
  const num = getRandomInt(1000, 3000);

  return new Promise((res) => {
    setTimeout(done, num);
  })
}

export const AsyncCase = () => {
  const page = state(1);

  return() => (
    <section>
      <button onClick={() => page.set(1)}>SINGLE</button>
      <button onClick={() => page.set(2)}>BASE</button>
      <br />
      {page.value === 1 ? <AsyncCaseSingle /> : <AsyncCaseBase />}
    </section>
  )
}


export const AsyncCaseSingle = () => {
  defineOptions({
    single: true,
  });

  const array = state(Array.from(new Array(10000), (_ ,index) => {
    return {
      name: index,
      state: 'empty',
    }
  }))

  // строка переживает замену объекта по `by`, поэтому обновление одного
  // элемента не пересобирает остальные 9999
  const setState = (index: number, next: string) => {
    array.set((list) => {
      const copy = [...list];
      copy[index] = { ...copy[index], state: next };
      return copy;
    });
  }

  const start = () => {
    for (let i = 0; i !== array.value.length; i++) {
      setState(i, 'progress');
      request(() => setState(i, 'done'));
    }
  }

  return () => (
    <>
      <h1>SINGLE</h1>
      <button onClick={start}>START</button>
      <div style='display: flex; flex-wrap: wrap; border'>
        <For each={array} by={(item: Item) => item.name}>
          {(item: State<Item>) => (
            <div
              class="async-item"
              style={() => `background-color: ${color(item.value)}`}
            >
              {() => item.value.name}
            </div>
          )}
        </For>
      </div>
    </>
  )
}

export const AsyncCaseBase = () => {
  const array = state(Array.from(new Array(10000), (_ ,index) => {
    return {
      name: index,
      state: 'empty',
    }
  }))

  const start = () => {
    for (let i = 0; i !== array.value.length; i++) {
      const item = array.value[i];
      item.state = 'progress';

      const newArray = [...array.value];
      newArray[i] = item;
      array.set(newArray);

      request(() => {
        item.state = 'done';
        const newArray = [...array.value];
        newArray[i] = item;
        array.set(newArray);
      })
    }
  }

  return () => (
    <>
      <h1>BASE</h1>
      <button onClick={start}>START</button>
      <div style='display: flex; flex-wrap: wrap; border'>
        {
          array.value.map((item, index) => (
            <div class="async-item" style={`background-color: ${color(item)}`} key={index}>{item.name}</div>
          ))
        }
      </div>
    </>
  )
}
