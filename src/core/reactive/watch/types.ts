export type CallbackWatch = (newValue?: unknown | unknown[], oldValue?: unknown | unknown[]) => void

export type OptionsWatch = {
  immediate?: boolean
};