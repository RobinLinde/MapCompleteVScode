/**
 * This file contains all functions that should be used when editing theme files
 * Theme files are located in the /assets/themes/{THEME_NAME}/{THEME_NAME}.json file
 *
 * This consists of the following functions:
 * - layerCompletionProvider: Provides a list of existing layers for autocompletion
 * - layerDefinitionProvider: Provides a definition for layers, allowing users to jump to the layer definition
 */

import * as vscode from "vscode";
import * as path from "path";
import { getAvailableLayers, getCursorPath } from "./utils";

/**
 * Layer completion provider
 *
 * This provider will provide a list of available layers for autocompletion
 *
 * JSON paths:
 * - layers.{index} (If this is a string)
 * - layers.{index}.builtin
 */
export const layerCompletionProvider =
  vscode.languages.registerCompletionItemProvider(
    {
      language: "json",
      scheme: "file",
      pattern: "**/assets/themes/*/*.json",
    },
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        console.log("layerCompletionProvider");
        // Now we'll need to try and get the current path for the cursor
        const text = document.getText();

        // Now we need to get the current path
        const jsonPath = getCursorPath(text, position);

        const regex = /^layers\.\d+(.builtin)*$/;
        if (regex.exec(jsonPath)) {
          // We need to get the available layers
          const layers = await getAvailableLayers();
          console.log(`Got ${layers.length} layers`);

          const items: vscode.CompletionItem[] = [];

          for (const layer of layers) {
            const item = new vscode.CompletionItem(layer);
            item.kind = vscode.CompletionItemKind.Value;
            items.push(item);
          }

          // Now we need to return the completion items
          return items;
        }

        return [];
      },
    }
  );

/**
 * Layer definition provider
 *
 * This provider will provide a definition for layers, allowing users to jump to the layer definition
 *
 * JSON paths:
 * - layers.{index} (If this is a string)
 * - layers.{index}.builtin
 */
export const layerDefinitionProvider =
  vscode.languages.registerDefinitionProvider(
    {
      language: "json",
      scheme: "file",
      pattern: "**/assets/themes/*/*.json",
    },
    {
      provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        console.log("layerDefinitionProvider");

        // We don't want to provide definitions for the license_info.json file
        if (document.fileName.endsWith("license_info.json")) {
          return null;
        }

        const text = document.getText();
        const jsonPath = getCursorPath(text, position);
        const json = JSON.parse(text);

        const regex = /^layers\.\d+(.builtin)*$/;
        if (regex.exec(jsonPath)) {
          const layer = json.layers[parseInt(jsonPath.split(".")[1])];
          // If an item is a string, it's a reference to a layer, also if it's an object and has a builtin property
          if (typeof layer === "string") {
            // We have a reference to a layer
            const layerPath = path.join(
              (vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0].uri.fsPath
                : "") || "",
              "assets",
              "layers",
              layer,
              layer + ".json"
            );
            console.log("Found reference to layer", layerPath);

            return new vscode.Location(
              vscode.Uri.file(layerPath),
              new vscode.Position(0, 0)
            );
          } else if (typeof layer === "object" && layer.builtin) {
            // We have a builtin layer
            const layerPath = path.join(
              (vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0].uri.fsPath
                : "") || "",
              "assets",
              "layers",
              layer.builtin,
              layer.builtin + ".json"
            );
            console.log("Found reference to layer (as builtin)", layerPath);

            return new vscode.Location(
              vscode.Uri.file(layerPath),
              new vscode.Position(0, 0)
            );
          }
        }

        return null;
      },
    }
  );
