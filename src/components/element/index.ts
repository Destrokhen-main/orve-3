export class ElementNode {
  htmlElement: HTMLElement | null = null;

  constructor(private jsx: any) {}

  mounter() {}

  updater(newJsx: any) {}

  unMounter() {
    if (!this.htmlElement) {
      return;
    }

    this.htmlElement.remove();
    this.htmlElement = null;
  }
}
