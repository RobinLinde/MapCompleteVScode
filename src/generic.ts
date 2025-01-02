/**
 * This file contains some function that are used both in theme files, as well in layer files
 */

import * as vscode from "vscode";
import {
  getCursorPath,
  getRawCursorPath,
  getStartEnd,
  getValueFromPath,
} from "./utils";
import * as path from "path";

/**
 * Icon definition provider
 *
 * This provider will provide a definition for icons, allowing users to jump to the icon file
 */
export const iconDefinitionProvider =
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
        console.log("iconDefinitionProvider");
        const text = document.getText();
        const jsonPath = getCursorPath(text, position);
        const rawJsonPath = getRawCursorPath(text, position);

        const regexes = [/icon$/, /icon.render/, /icon.mappings.\d+.then$/];

        if (regexes.some((regex) => regex.exec(jsonPath))) {
          const iconPath = getValueFromPath(text, rawJsonPath);
          console.log("Found reference to icon", iconPath);

          let fullIconPath: string;

          // Check if the path starts with a dot, if so, it's a relative path
          // if not, it's a built-in icon
          if (!iconPath.startsWith(".")) {
            // For built-in icons, it's possible that a color is specified, like circle:red, so we need to remove that
            const parts = iconPath.split(":");
            fullIconPath = path.join(
              (vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0].uri.fsPath
                : "") || "",
              "assets",
              "svg",
              parts[0] + ".svg"
            );
          } else {
            fullIconPath = path.join(
              (vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0].uri.fsPath
                : "") || "",
              iconPath
            );
          }

          const startEnd = getStartEnd(text, rawJsonPath);

          const link: vscode.DefinitionLink = {
            targetUri: vscode.Uri.file(fullIconPath),
            targetRange: new vscode.Range(0, 0, 0, 0),
            originSelectionRange: startEnd,
          };

          return [link];
        }

        return [];
      },
    }
  );
