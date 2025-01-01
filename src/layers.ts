/**
 * This file contains all functions that should be used when editing layers
 * Layer files are located in the /assets/layers/{LAYER_NAME}.json file
 * This is also loaded when editing the theme files, as layers can be inline in the theme files
 *
 * This consists of the following functions:
 * - tagRenderingCompletionProvider: Provides a list of existing tag renderings for autocompletion
 * - tagRenderingDefinitionProvider: Provides a definition for tag renderings, allowing users to jump to the tag rendering definition
 */

import * as vscode from "vscode";
import {
  getCursorPath,
  getRawCursorPath,
  getStartEnd,
  getTagRenderings,
  getValueFromPath,
} from "./utils";
import { JSONPath } from "jsonc-parser";

export const tagRenderingCompletionProvider =
  vscode.languages.registerCompletionItemProvider(
    {
      language: "json",
      scheme: "file",
      pattern: "**/assets/layers/*/*.json",
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

        console.log("tagRenderingCompletionProvider");
        const text = document.getText();
        const jsonPath = getCursorPath(text, position);

        const regex = /^(layers.\d+.)?tagRenderings\.\d+(.builtin)?$/;
        if (regex.exec(jsonPath)) {
          const tagRenderings = await getTagRenderings();
          console.log(`Got ${tagRenderings.length} tagRenderings`);

          // Now we need to return the completion items
          return tagRenderings;
        }

        return [];
      },
    }
  );

/**
 * Tag rendering definition provider
 */
export const tagRenderingDefinitionProvider =
  vscode.languages.registerDefinitionProvider(
    {
      language: "json",
      scheme: "file",
      pattern: "**/assets/layers/*/*.json",
    },
    {
      async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        console.log("tagRenderingDefinitionProvider");
        const text = document.getText();
        const jsonPath = getCursorPath(text, position);
        const rawJsonPath = getRawCursorPath(text, position);

        const regex = /^(layers.\d.)?tagRenderings.\d*(.builtin)?$/;

        if (regex.exec(jsonPath)) {
          const tagRendering = getValueFromPath(text, rawJsonPath);

          if (typeof tagRendering === "string") {
            console.log("Found reference to tagRendering", tagRendering);
            if (tagRendering.indexOf(".") === -1) {
              console.log("This is a built-in tag rendering");
              // This is a built-in tag rendering
              // Read the built-in tag renderings file
              const layerFile = await vscode.workspace.findFiles(
                "assets/layers/questions/questions.json"
              );
              if (layerFile.length === 0) {
                return null;
              }

              const layerText = await vscode.workspace.fs.readFile(
                layerFile[0]
              );
              const layerTextString = new TextDecoder().decode(layerText);
              const layer = JSON.parse(layerTextString);

              const tagRenderingIndex = layer.tagRenderings.findIndex(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (tr: any) => tr.id === tagRendering
              );

              const path: JSONPath = ["tagRenderings", tagRenderingIndex];
              const startEnd = getStartEnd(layerTextString, path);

              const link: vscode.DefinitionLink = {
                targetUri: layerFile[0],
                targetRange: startEnd,
                originSelectionRange: getStartEnd(text, rawJsonPath),
              };

              return [link];
            } else {
              // This is a reference to a tag rendering in another layer
              // We need to find the layer and the tag rendering
              const layerName = tagRendering.split(".")[0];
              const tagRenderingName = tagRendering.split(".")[1];

              const layerFile = await vscode.workspace.findFiles(
                `assets/layers/${layerName}/${layerName}.json`
              );
              if (layerFile.length === 0) {
                return null;
              }

              const layerText = await vscode.workspace.fs.readFile(
                layerFile[0]
              );
              const layerTextString = new TextDecoder().decode(layerText);
              const layer = JSON.parse(layerTextString);

              const tagRenderingIndex = layer.tagRenderings.findIndex(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (tr: any) => tr.id === tagRenderingName
              );

              const path: JSONPath = ["tagRenderings", tagRenderingIndex];
              const startEnd = getStartEnd(layerTextString, path);

              const link: vscode.DefinitionLink = {
                targetUri: layerFile[0],
                targetRange: startEnd,
                originSelectionRange: getStartEnd(text, rawJsonPath),
              };

              return [link];
            }
          }
        }

        return null;
      },
    }
  );
