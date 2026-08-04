import { createComment } from "../../utils/helperNode/index.js";
import { toChildArray } from "../jsx.js";
import { createView } from "../mount.js";
import { NS, getNS, withNS } from "../namespace.js";
import { patchChildren } from "../patch.js";
import { Child, View } from "../types.js";
import { BaseView } from "./base.js";

/**
 * Несколько узлов на одном уровне. Держит замыкающий комментарий-якорь:
 * по нему понятно, куда вставлять детей и где заканчивается фрагмент.
 */
export class FragmentView extends BaseView {
  private anchor: Comment | null = null;
  private children: View[] = [];
  private readonly ns: NS = getNS();

  constructor(private source: Child[]) {
    super();
  }

  mount(parent: Node, anchor: Node | null) {
    this.parentNode = parent;
    this.anchor = createComment("");
    parent.insertBefore(this.anchor, anchor);

    this.runScoped(() => {
      withNS(this.ns, () => {
        this.children = this.source.map(createView);
        this.children.forEach((child) => child.mount(parent, this.anchor));
      });
    });

    this.mounted = true;
  }

  update(next: Child): boolean {
    const list = toChildArray(next);
    if (!list) {
      return false;
    }

    this.runScoped(() => {
      withNS(this.ns, () => {
        this.children = patchChildren(
          this.parentNode!,
          this.anchor,
          this.children,
          list,
        );
      });
    });

    return true;
  }

  nodes(): Node[] {
    const nodes = this.children.flatMap((child) => child.nodes());
    return this.anchor ? [...nodes, this.anchor] : nodes;
  }

  unmount() {
    this.children.forEach((child) => child.unmount());
    this.children = [];
    super.unmount();
    this.anchor?.parentNode?.removeChild(this.anchor);
    this.anchor = null;
  }
}
