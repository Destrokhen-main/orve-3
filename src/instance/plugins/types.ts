import { OrveInstanceType } from "../types.js"

export type OrvePluginType = {
  setup: (instance: OrveInstanceType['plugins']) => void
}