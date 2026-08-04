import { computed, inject, provide, State, state, watch } from "orve";

const Paginator = (props: { page: number, limit: number, size: number }) => {
  const buttonsCount = computed(() => Math.ceil(props.size / props.limit));
  const array = computed(() => Array.from({ length: buttonsCount.value }, (_, i) => i + 1));

  const context = inject<{ page: State<number>, limit: State<number> }>(key);

  if (context) {
    watch(() => {
      if (context.page.value > buttonsCount.value) {
        context.page.set(buttonsCount.value);
      }
    }, buttonsCount)
  }

  return () => (
    <div>
      {array.value.map((i, index) => {
          const style = index + 1 === context?.page.value ? 'color: red' : '';

          return (
            <button
              key={index}
              onClick={() => {
                if (context) {
                  context.page.set(Number(index + 1));
                }
              }}
              style={style}
            >
              {i}
            </button>
          )
        }
      )}
      <select onChange={(e: any) => {
        if (context) {
          context.limit.set(Number(e.target.value));
        }
      }}>
        <option value="1">1</option>
        <option value="5">5</option>
        <option value="10" selected>10</option>
      </select>
    </div>
  )
}

const key = Symbol('key');

export const Async = () => {
  const posts = state<{ id: number, title: string }[]>([]);
  const page = state(1);
  const limit = state(10);

  const loading = computed(() => posts.value.length === 0);

  async function init() {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const data = await response.json();
    posts.set(data);
  }

  provide(key, {
    page,
    limit,
  })

  init();

  const postsArray = computed(() => {
    return posts.value.slice((page.value - 1) * limit.value, page.value * limit.value);
  })

  return () => (
    <>
    {
      loading.value ? <div>Loading...</div> : (
        <section>
          {
            postsArray.value.map((post) => <div key={post.id}>{post.title}</div>)
          }
          <Paginator page={page.value} limit={limit.value} size={posts.value.length}/>
        </section>
      )
    }
    </>
  )
}
