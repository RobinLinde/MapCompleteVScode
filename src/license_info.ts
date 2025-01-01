/**
 * This file contains all functions that should be used when editing license_info files
 * License info files are located in the /assets/{themes/layers}/{name}/license_info.json file
 *
 * This consists of the following functions:
 * - pathDefinitionProvider: Provides a definition for paths, allowing users to jump to the image file
 */

import * as vscode from "vscode";
import * as path from "path";
import {
  getCursorPath,
  getRawCursorPath,
  getStartEnd,
  getValueFromPath,
} from "./utils";

/**
 * Path definition provider
 *
 * This provider will provide a definition for paths, allowing users to jump to the image file
 *
 * JSON path:
 * - {index}.path
 */
export const pathDefinitionProvider =
  vscode.languages.registerDefinitionProvider(
    {
      language: "json",
      scheme: "file",
      pattern: "**/assets/*/*/license_info.json",
    },
    {
      provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        console.log("pathDefinitionProvider");
        const text = document.getText();
        const jsonPath = getCursorPath(text, position);
        const rawPath = getRawCursorPath(text, position);

        const regex = /^\d+.path$/;
        if (regex.exec(jsonPath)) {
          const imageFile = getValueFromPath(text, rawPath);
          console.log("Found reference to filw", imageFile);

          const imagePath = path.join(
            path.dirname(document.fileName),
            imageFile
          );

          const link: vscode.LocationLink = {
            originSelectionRange: getStartEnd(text, rawPath),
            targetUri: vscode.Uri.file(imagePath),
            targetRange: new vscode.Range(0, 0, 0, 0),
          };

          return [link];
        }
      },
    }
  );
