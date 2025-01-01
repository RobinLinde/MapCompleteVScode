import * as vscode from "vscode";
import { layerCompletionProvider, layerDefinitionProvider } from "./theme";
import { iconDefinitionProvider } from "./generic";
import {
  filterCompletionProvider,
  filterDefinitionProvider,
  tagRenderingCompletionProvider,
  tagRenderingDefinitionProvider,
} from "./layers";
import { pathDefinitionProvider } from "./license_info";

export function activate(context: vscode.ExtensionContext) {
  // Activate all theme related features
  context.subscriptions.push(layerCompletionProvider, layerDefinitionProvider);

  // Activate all layer related features
  context.subscriptions.push(
    tagRenderingCompletionProvider,
    tagRenderingDefinitionProvider,
    filterCompletionProvider,
    filterDefinitionProvider
  );

  // Activate all license info related features
  context.subscriptions.push(pathDefinitionProvider);

  // Activate all generic features
  context.subscriptions.push(iconDefinitionProvider);
}
