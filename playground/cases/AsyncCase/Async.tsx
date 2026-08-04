import { defineOptions, For, state } from "orve";

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
      <h1>SINGLE</h1>
      <button onClick={start}>START</button>
      <div style='display: flex; flex-wrap: wrap; border'>
        <For each={array}>
          {(item, index) => {
            let state = 'unset';
            if (item.state === 'progress') {
              state = 'yellow';
            } else if (item.state === 'done') {
              state = 'green';
            }

            return <div class="async-item" style={`background-color: ${state}`} key={index}>{item.name}</div>
          }}
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
          array.value.map((item, index) => {
            let state = 'unset';
            if (item.state === 'progress') {
              state = 'yellow';
            } else if (item.state === 'done') {
              state = 'green';
            }

            return <div class="async-item" style={`background-color: ${state}`} key={index}>{item.name}</div>
          })
        }
      </div>
    </>
  )
}
