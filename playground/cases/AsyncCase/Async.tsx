import { For, state } from "orve";

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
    <section>
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
    </section>
  )
}