export type LifecycleHook = () => void;

export type Hooks = {
  mounted: LifecycleHook[];
  beforeUnmounted: LifecycleHook[];
  unmounted: LifecycleHook[];
};

export function createHooks(): Hooks {
  return { mounted: [], beforeUnmounted: [], unmounted: [] };
}

/**
 * Инстанс, чей `setup` выполняется прямо сейчас. Стек, а не одна ячейка:
 * setup компонента может смонтировать другой компонент.
 */
const stack: Hooks[] = [];

export function pushHooks(hooks: Hooks) {
  stack.push(hooks);
}

export function popHooks() {
  stack.pop();
}

function current(): Hooks | null {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

function add(kind: keyof Hooks, fn: LifecycleHook, name: string) {
  const hooks = current();

  if (!hooks) {
    console.warn(
      `[orve] ${name} вызван вне setup компонента — колбэк никогда не сработает.`,
    );
    return;
  }

  hooks[kind].push(fn);
}

/** Компонент отрисован и уже стоит в документе. Дети — раньше родителей. */
export function onMounted(fn: LifecycleHook) {
  add("mounted", fn, "onMounted");
}

/** Перед снятием: DOM ещё на месте, эффекты ещё живы. */
export function onBeforeUnmounted(fn: LifecycleHook) {
  add("beforeUnmounted", fn, "onBeforeUnmounted");
}

/** После снятия: узлы удалены, область эффектов остановлена. */
export function onUnmounted(fn: LifecycleHook) {
  add("unmounted", fn, "onUnmounted");
}

/** Ошибка в хуке не должна ронять монтирование соседей. */
export function runHooks(hooks: LifecycleHook[], name: string) {
  for (const hook of hooks) {
    try {
      hook();
    } catch (error) {
      console.error(`[orve] ошибка в ${name}`, error);
    }
  }
}

/**
 * Очередь отложенных `onMounted`.
 *
 * Элемент вставляется в родителя последним действием своего монтирования,
 * поэтому в момент, когда вложенный компонент «готов», его узлов ещё нет
 * в документе. Копим колбэки и разбираем очередь, когда завершилось самое
 * внешнее монтирование — тогда дерево уже на месте и можно мерить геометрию.
 */
let depth = 0;
let pending: LifecycleHook[] = [];

export function beginMount() {
  depth++;
}

export function endMount(hooks: LifecycleHook[]) {
  // порядок постановки — снизу вверх: дети завершают монтирование раньше
  pending.push(...hooks);
  depth--;

  if (depth === 0 && pending.length > 0) {
    const queued = pending;
    pending = [];
    runHooks(queued, "onMounted");
  }
}
