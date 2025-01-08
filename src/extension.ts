import * as vscode from "vscode";
import { layerCompletionProvider, layerDefinitionProvider } from "./theme";
import { colorProvider, iconDefinitionProvider } from "./generic";
import {
  filterCompletionProvider,
  filterDefinitionProvider,
  filterImplementationProvider,
  tagRenderingCompletionProvider,
  tagRenderingDefinitionProvider,
  tagRenderingImplementationProvider,
} from "./layers";
import { pathDefinitionProvider } from "./license_info";
import { CacheWorker } from "./utils/cache";

export async function activate(context: vscode.ExtensionContext) {
  // Activate all theme related features
  context.subscriptions.push(layerCompletionProvider, layerDefinitionProvider);

  // Activate all layer related features
  context.subscriptions.push(
    tagRenderingCompletionProvider,
    tagRenderingDefinitionProvider,
    filterCompletionProvider,
    filterDefinitionProvider,
    tagRenderingImplementationProvider,
    filterImplementationProvider
  );

  // Activate all license info related features
  context.subscriptions.push(pathDefinitionProvider);

  // Activate all generic features
  context.subscriptions.push(iconDefinitionProvider, colorProvider);

  // Upon activation, we also scan the workspace for all themes and layers
  // and save them in a cache, so we can quickly look up definitions and completions
  // for each theme and layer
  // We should also listen for changes in the workspace, so we can update the cache
  CacheWorker.create(context);
}
