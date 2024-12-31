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
      pattern: "**/assets/**/*.json",
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

        for (const regex of regexes) {
          if (regex.exec(jsonPath)) {
            const iconPath = getValueFromPath(text, rawJsonPath);
            console.log("Found reference to icon", iconPath);

            let fullIconPath: string;

            // Check if the path starts with a dot, if so, it's a relative path
            // if not, it's a built-in icon
            if (!iconPath.startsWith(".")) {
              fullIconPath = path.join(
                (vscode.workspace.workspaceFolders
                  ? vscode.workspace.workspaceFolders[0].uri.fsPath
                  : "") || "",
                "assets",
                "svg",
                iconPath + ".svg"
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
            console.log("fullIconPath", fullIconPath);
            console.log(
              "startEndLines",
              startEnd.start.line,
              startEnd.end.line
            );
            console.log(
              "startEndChars",
              startEnd.start.character,
              startEnd.end.character
            );

            const link: vscode.DefinitionLink = {
              targetUri: vscode.Uri.file(fullIconPath),
              targetRange: new vscode.Range(0, 0, 0, 0),
              originSelectionRange: startEnd,
            };

            return [link];
          }
        }

        return [];
      },
    }
  );
