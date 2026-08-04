import { PluginController } from "./web/src/engine/PluginController.ts";
import { CreateStorageController } from "./web/src/engine/StorageController.ts";
import { SettingsManager } from "./web/src/engine/SettingsManager.ts";

console.log("Loading plugins...");

const storage = CreateStorageController();
const settings = new SettingsManager(storage);

const plugins = new PluginController(storage, settings);

console.log("Websites:", plugins.WebsitePlugins.length);

for (const site of plugins.WebsitePlugins) {
    console.log(site);
}