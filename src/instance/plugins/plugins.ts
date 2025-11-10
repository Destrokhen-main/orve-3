import { OrvePluginType } from "./types";

export class OrvePlugin {
  constructor(
    private instance: Record<string, unknown>,
    private plugin: OrvePluginType
  ) {
    const _plugin: Record<string, unknown> = {}

    try {
      this.plugin.setup(_plugin);
      this.instance = {
        ...this.instance,
        ..._plugin
      }
    } catch (err) {
      console.error('[PLUGIN]', err);
    }
  }
}
