/**
 * This file contains all functions that should mainly be used when editing theme files
 * All of these are related to looking for layer references in the theme files, but some layers also reference other layers
 * Theme files are located in the /assets/themes/{THEME_NAME}/{THEME_NAME}.json file
 *
 * This consists of the following functions:
 * - layerCompletionProvider: Provides a list of existing layers for autocompletion
 * - layerDefinitionProvider: Provides a definition for layers, allowing users to jump to the layer definition
 */

import * as vscode from "vscode";
import * as path from "path";
import { getCursorPath, getRawCursorPath } from "./utils/cursor";
import { getAvailableLayers } from "./utils/mapcomplete";
import { getValueFromPath } from "./utils/json";

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
      pattern: "**/assets/*/*/*.json",
    },
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        // Stop running if the file is called license_info.json
        if (document.fileName.includes("license_info")) {
          return [];
        }

        console.log("layerCompletionProvider");
        const text = document.getText();
        const jsonPath = getCursorPath(text, position);

        const regexes = [
          /^layers\.\d+(.builtin)?$/,
          /^(layers.\d+.)?presets.\d+.snapToLayer(.\d)*$/,
        ];
        if (regexes.some((regex) => regex.exec(jsonPath))) {
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
 * - layers.{index}.builtin.{index}
 * - (layers.{index}.)presets.{index}.snapToLayer(.{index})
 */
export const layerDefinitionProvider =
  vscode.languages.registerDefinitionProvider(
    {
      language: "json",
      scheme: "file",
      pattern: "**/assets/*/*/*.json",
    },
    {
      provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        // Stop running if the file is called license_info.json
        if (document.fileName.includes("license_info")) {
          return [];
        }

        console.log("layerDefinitionProvider");

        const text = document.getText();
        const jsonPath = getCursorPath(text, position);
        const rawJsonPath = getRawCursorPath(text, position);

        const regexes = [
          /^layers\.\d+(.builtin(.\d+)?)?$/,
          /^(layers.\d+.)?presets.\d+.snapToLayer(.\d)*$/,
        ];
        if (regexes.some((regex) => regex.exec(jsonPath))) {
          console.log("Found reference to layer");
          const layer = getValueFromPath(text, rawJsonPath);
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
