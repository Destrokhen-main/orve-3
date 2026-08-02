import { computed, onBeforeUnmounted, onMounted, onUnmounted, state } from "orve"

function throttle(func: any, ms: any) {
  let isThrottled = false,
      savedArgs: any,
      savedThis: any;

  function wrapper(...args: any[]) {
    if (isThrottled) {
      savedArgs = args;
      // @ts-ignore
      savedThis = this;
      return;
    }

    // @ts-ignore
    func.apply(this, args);
    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = null;
        savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}

export const Styles = () => {
  const signal = new AbortController();
  const coord = state({
    x: 0,
    y: 0,
  })
  const fn = throttle((e: any) => {
    coord.set({
      x: e.x - 420,
      y: e.y - 200
    })
  }, 50)

  onMounted(() => {
    const el = document.querySelector('#case');

    if (el) {
      el.addEventListener('mousemove', (e: any) => {
        fn(e);
      }, {
        signal: signal.signal
      })
    }
  })

  onBeforeUnmounted(() => {
    signal.abort();
  })

  const style = computed(() => {
    return `top:${coord.value.y}px;left:${coord.value.x}px`;
  })

  return () => (
    <>
      {coord.value.x} / {coord.value.y}
      <section id='case' style="height: 100dvh; position: relative">
        <div style={style.value} class="buble"></div>
      </section>
    </>
  )
}