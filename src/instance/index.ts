import { OrvePlugin } from "./plugins/plugins";
import { OrvePluginType } from "./plugins/types";
import { OrveInstanceType } from "./types";

export class OrveInstance {
  private instance: OrveInstanceType = {
    plugins: {},
  };

  constructor() {}

  use(plugin: OrvePluginType) {
    const _plugin = new OrvePlugin(this.instance.plugins, plugin);

    this.instance.plugins = {
      ...this.instance.plugins,
      ..._plugin.pluginContext,
    }
    return this;
  }

  _getPlugins() {
    return this.instance.plugins;
  }

  rootComponent(app: any) {
    
  }
  mountRoot(el: HTMLElement | string) {}
}

export function createInstance() {
  return new OrveInstance();
}