import * as vscode from "vscode";
import { layerCompletionProvider, layerDefinitionProvider } from "./theme";
import { iconDefinitionProvider } from "./generic";

export function activate(context: vscode.ExtensionContext) {
  // Activate all theme related features
  context.subscriptions.push(layerCompletionProvider, layerDefinitionProvider);

  // Activate all generic features
  context.subscriptions.push(iconDefinitionProvider);
}
