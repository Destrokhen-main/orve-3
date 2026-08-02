import { EffectScope, effectScope } from "../../core/reactive";
import { Child, Key, View } from "../types";

/**
 * Каждое представление владеет своей областью эффектов. Область создаётся
 * в конструкторе, поэтому автоматически становится дочерней для той, что
 * активна в момент создания — вся ветка умирает одним `stop()`.
 */
export abstract class BaseView implements View {
  readonly scope: EffectScope = effectScope();

  key: Key = null;
  protected parentNode: Node | null = null;
  protected mounted = false;

  abstract mount(parent: Node, anchor: Node | null): void;
  abstract update(next: Child): boolean;
  abstract nodes(): Node[];

  first(): Node | null {
    return this.nodes()[0] ?? null;
  }

  unmount() {
    this.scope.stop();
    this.mounted = false;
  }
}
