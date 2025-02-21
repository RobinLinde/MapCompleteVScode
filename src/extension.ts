import * as vscode from "vscode";
import { layerCompletionProvider, layerDefinitionProvider } from "./theme";
import { colorProvider, iconDefinitionProvider } from "./generic";
import {
  filterCompletionProvider,
  filterDefinitionProvider,
  filterImplementationProvider,
  layerImplementationProvider,
  tagRenderingCompletionProvider,
  tagRenderingDefinitionProvider,
  tagRenderingImplementationProvider,
} from "./layers";
import { pathDefinitionProvider } from "./license_info";
import { CacheWorker } from "./utils/cache";

export async function activate(context: vscode.ExtensionContext) {
  let cacheWorker: CacheWorker | undefined;

  // Listen for changes in the caching setting
  vscode.workspace.onDidChangeConfiguration(async (e) => {
    if (e.affectsConfiguration("mapcomplete.caching")) {
      if (vscode.workspace.getConfiguration("mapcomplete").get("caching")) {
        cacheWorker = await CacheWorker.create(context);
      } else {
        cacheWorker?.dispose();
        cacheWorker = undefined;
      }
    }
  });

  // Listen for refreshCache command
  vscode.commands.registerCommand("mapcomplete.refresh", async () => {
    if (cacheWorker) {
      await cacheWorker.refreshCache();
    }
  });

  // Activate all theme related features
  context.subscriptions.push(layerCompletionProvider, layerDefinitionProvider);

  // Activate all layer related features
  context.subscriptions.push(
    tagRenderingCompletionProvider,
    tagRenderingDefinitionProvider,
    filterCompletionProvider,
    filterDefinitionProvider,
    tagRenderingImplementationProvider,
    filterImplementationProvider,
    layerImplementationProvider
  );

  // Activate all license info related features
  context.subscriptions.push(pathDefinitionProvider);

  // Activate all generic features
  context.subscriptions.push(iconDefinitionProvider, colorProvider);

  // Activate the cache worker, if caching is enabled
  if (vscode.workspace.getConfiguration("mapcomplete").get("caching")) {
    cacheWorker = await CacheWorker.create(context);
  }
}
