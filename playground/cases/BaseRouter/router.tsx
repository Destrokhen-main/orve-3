import { Component, ComponentFn, computed, defineOptions, OrvePluginType, requirePlugin, State, state } from "orve";

type Route = {
  name: string,
  path: string,
  component: ComponentFn
}

const ROUTER: {
  allRouter: Route[],
  currentRouter: State<Route | null>,
  mode: 'history' | 'hash'
} = {
  allRouter: [],
  currentRouter: state<Route | null>(null, { equals: false }),
  mode: "history"
};

function windowEvent() {
  if (ROUTER.mode === "history") {
    window.addEventListener("popstate", () => {
      const current = document.location.pathname;
      console.log(current);
      worker(current);
    })
  } else {
    window.addEventListener("hashchange", () => {
      const current = document.location.hash.replace("#", "");
      worker(current);
    })
  }
}

function worker(path: string | null = null) {
  let Path = path;

  if (path === null) {
    Path = ROUTER.mode === "history" ? document.location.pathname : document.location.hash.replace("#", "");
    if (Path === "") Path = "/";
  }

  const currentRouter = ROUTER.allRouter.find((route) => route.path === Path);

  let bool = false;

  if (currentRouter !== undefined) {
    ROUTER.currentRouter.set(currentRouter);
    bool = true;
  } else {
    console.error("404");
  }
  return bool;
}

function changeURl(state: keyof History = "pushState", path: string) {
  if (ROUTER.mode === "hash") {
    window.location.hash = "#" + path
  } else {
    window.history[state]({}, "", path);
    worker(path);
  }
}

function createRouter(routers: Route[], mode: 'hash' | 'history' = 'history'): OrvePluginType {
  ROUTER.allRouter = routers;
  ROUTER.mode = mode;
  
  const ready = worker();

  if (ready) {
    windowEvent();
  }

  return {
    setup(ctx) {
      ctx.$router = {
        push: (path: string) => {
          changeURl('pushState', path);
        },
        currentRoute() { return ROUTER.currentRouter }
      }
    }
  }
}

export const RouterLink: ComponentFn = (props) => {
  defineOptions({
    single: true
  })

  const router = requirePlugin('$router') as any;
  const currentRoute = router.currentRoute() as State<Route>;

  const component = computed(() => {
    return currentRoute.value.component;
  })

  return () => (
    <Component is={component}>
      {props.children}
    </Component>
  )
}

export const router = createRouter([
  {
    path: '/',
    component: (props) => () => <div>1 {props.children}</div>,
    name: 'Main'
  },
  {
    path: '/a',
    component: (props) => () => <div>a {props.children}</div>,
    name: 'Main1'
  }
])