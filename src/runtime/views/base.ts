import {
  EffectScope,
  ScopeHost,
  effectScope,
  getCurrentScopeHost,
  runWithScopeHost,
} from "../../core/reactive/index.js";
import { Child, Key, View } from "../types.js";

/**
 * Каждое представление владеет своей областью эффектов, но создаёт её лениво —
 * только когда внутри `runScoped` действительно появился эффект или вложенная
 * область. Текстовый узел не платит за это ничего.
 *
 * Владелец родительской области запоминается в конструкторе, поэтому
 * материализованная позже область встаёт в ту же ветку дерева и вся ветка
 * по-прежнему умирает одним `stop()`.
 */
export abstract class BaseView implements View, ScopeHost {
  key: Key = null;
  protected parentNode: Node | null = null;
  protected mounted = false;

  private readonly parentHost: ScopeHost | null = getCurrentScopeHost();
  private ownScope: EffectScope | null = null;
  private scopeStopped = false;

  /** Область этого представления; обращение к ней её и создаёт. */
  get scope(): EffectScope {
    return this.resolveScope();
  }

  resolveScope(): EffectScope {
    if (!this.ownScope) {
      const scope = effectScope(true);
      this.ownScope = scope;

      if (this.scopeStopped) {
        scope.stop();
      } else {
        this.parentHost?.resolveScope().add(scope);
      }
    }
    return this.ownScope;
  }

  abstract mount(parent: Node, anchor: Node | null): void;
  abstract update(next: Child): boolean;
  abstract nodes(): Node[];

  first(): Node | null {
    return this.nodes()[0] ?? null;
  }

  unmount() {
    this.ownScope?.stop();
    this.scopeStopped = true;
    this.mounted = false;
  }

  /**
   * Выполнить работу от имени своей области. Пока область не понадобилась,
   * текущим владельцем становится само представление.
   */
  protected runScoped<T>(fn: () => T): T | undefined {
    if (this.ownScope) {
      return this.ownScope.run(fn);
    }
    if (this.scopeStopped) {
      return undefined;
    }
    return runWithScopeHost(this, fn);
  }
}
