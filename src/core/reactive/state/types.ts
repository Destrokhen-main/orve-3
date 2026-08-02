export type StateOptions<T = any> = {
  /**
   * Как сравнивать старое и новое значение.
   * По умолчанию `Object.is`. `false` — считать любую запись изменением
   * (нужно, когда объект мутируют по месту и переприсваивают ту же ссылку).
   */
  equals?: false | ((oldValue: T, newValue: T) => boolean);
};
