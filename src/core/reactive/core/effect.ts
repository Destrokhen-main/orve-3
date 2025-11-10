export class Effect {
  constructor(
    private _fn: () => void,
    private _isActive: boolean = true
  ) {}

  get isActive() {
    return this._isActive
  }

  set isActive(value: boolean) {
    if (this._isActive !== value) {
      this._isActive = value;
    }
  }

  get fn() {
    return this._fn;
  }
}