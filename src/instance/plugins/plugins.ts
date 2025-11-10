import { OrvePluginType } from "./types";

export class OrvePlugin {
  pluginContext;

  constructor(
    private instance: Record<string, unknown>,
    private plugin: OrvePluginType
  ) {
    const _plugin: Record<string, unknown> = { ...this.instance };

    try {
      this.plugin.setup(_plugin);
      this.pluginContext = _plugin;
    } catch (err) {
      console.error('[PLUGIN]', err);
    }
  }
}
