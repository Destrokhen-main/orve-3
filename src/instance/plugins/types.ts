import { OrveInstanceType } from "../types"

export type OrvePluginType = {
  setup: (instance: OrveInstanceType['plugins']) => void
}