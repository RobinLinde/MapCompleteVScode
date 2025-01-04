/**
 * This file contains some function that are used both in theme files, as well in layer files
 */

import * as vscode from "vscode";
import { getCursorPath, getRawCursorPath, getStartEnd } from "./utils/cursor";
import { getValueFromPath, pathToJSONPath } from "./utils/json";
import * as path from "path";
import {
  findHexColorName,
  mapCompleteToVScode,
  vsCodeToHex,
} from "./utils/color";

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

/**
 * Color provider
 *
 * Some fields in MapComplete actually represent colors, this provider will provide a color presentation for these fields
 * Colours can be represented in two ways:
 * - As a hex color, like #ff0000ff or #ff0000
 * - As a color name, like red
 *
 * JSON paths:
 * - (layers.{index}(.override).)lineRendering.{index}.color
 * - (layers.{index}(.override).)lineRendering.{index}.color.render
 * - (layers.{index}(.override).)lineRendering.{index}.color.mappings.{index}.then
 * - (layers.{index}(.override).)lineRendering.{index}.fillColor
 * - (layers.{index}(.override).)lineRendering.{index}.fillColor.render
 * - (layers.{index}(.override).)lineRendering.{index}.fillColor.mappings.{index}.then
 * - (layers.{index}(.override).)pointRendering.{index}.marker.{index}.color
 * - (layers.{index}(.override).)pointRendering.{index}.marker.{index}.color.render
 * - (layers.{index}(.override).)pointRendering.{index}.marker.{index}.color.mappings.{index}.then
 *
 * In all cases (layers.{index}.) can also be replaced by overrideAll
 *
 */
export const colorProvider = vscode.languages.registerColorProvider(
  {
    language: "json",
    scheme: "file",
    pattern: "**/assets/*/*/*.json",
  },
  {
    provideColorPresentations(color, _context, _token) {
      console.log("colorProvider.provideColorPresentations");

      let outputColor: string;

      // Convert the color to a hex string
      outputColor = vsCodeToHex(color);

      // If the color is fully opaque (AKA it ends with FF), we can remove the alpha channel
      outputColor = outputColor.endsWith("ff")
        ? outputColor.substring(0, 7)
        : outputColor;
      // See if we can find a color name
      const colorName = findHexColorName(outputColor);
      if (colorName) {
        outputColor = colorName.name;
      }

      // If we have a pair like #AABBCC, we can shorten that to #ABC
      if (
        outputColor[1] === outputColor[2] &&
        outputColor[3] === outputColor[4] &&
        outputColor[5] === outputColor[6]
      ) {
        outputColor = `#${outputColor[1]}${outputColor[3]}${outputColor[5]}`;
      }

      console.log("Output color from picker:", outputColor);

      return [
        {
          label: outputColor,
        },
      ];
    },
    provideDocumentColors(document, _token) {
      console.log("colorProvider.provideDocumentColors");

      const text = document.getText();
      const colors: vscode.ColorInformation[] = [];
      const jsonParsed = JSON.parse(text);
      const allPaths: string[] = [];

      // Find all paths in the JSON
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const findPaths = (obj: any, path = "") => {
        for (const key in obj) {
          if (typeof obj[key] === "object") {
            findPaths(obj[key], path + key + ".");
          } else {
            allPaths.push(path + key);
          }
        }
      };
      findPaths(jsonParsed);

      const regexes = [
        /^((layers\.\d+\.(override\.([+=])?)?)|(overrideAll\.))?lineRendering\.\d+\.color((\.render)|(\.mappings\.\d+\.then))?$/,
        /^((layers\.\d+\.(override\.([+=])?)?)|(overrideAll\.))?lineRendering.\d+.fillColor((.render)|(.mappings.\d+.then))?$/,
        /^((layers\.\d+\.(override\.([+=])?)?)|(overrideAll\.))?pointRendering.\d+.marker.\d+.color((.render)|(.mappings.\d+.then))?$/,
      ];

      regexes.forEach((regex) => {
        allPaths.forEach((path) => {
          if (regex.exec(path)) {
            const colorValue = getValueFromPath(text, pathToJSONPath(path));

            const colorOuput = mapCompleteToVScode(colorValue);

            if (!colorOuput) {
              return;
            }

            console.log(
              `Output color: ${colorOuput.red}, ${colorOuput.green}, ${colorOuput.blue}, ${colorOuput.alpha}`
            );

            colors.push({
              color: colorOuput,
              range: getStartEnd(text, pathToJSONPath(path)),
            });
          }
        });
      });

      return colors;
    },
  }
);
