/**
 * This file contains some function that are used both in theme files, as well in layer files
 */

import * as vscode from "vscode";
import {
  getCursorPath,
  getRawCursorPath,
  getStartEnd,
  getValueFromPath,
  pathToJSONPath,
} from "./utils";
import { ColorTranslator } from "colortranslator";
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

/**
 * Color provider
 *
 * Some fields in MapComplete actually represent colors, this provider will provide a color presentation for these fields
 * Colours can be represented in two ways:
 * - As a hex color, like #ff0000ff or #ff0000
 * - As a color name, like red
 *
 * JSON paths:
 * - (layers.{index}.)lineRendering.{index}.color
 * - (layers.{index}.)lineRendering.{index}.color.render
 * - (layers.{index}.)lineRendering.{index}.color.mappings.{index}.then
 * - (layers.{index}.)lineRendering.{index}.fillColor
 * - (layers.{index}.)lineRendering.{index}.fillColor.render
 * - (layers.{index}.)lineRendering.{index}.fillColor.mappings.{index}.then
 * - (layers.{index}.)pointRendering.{index}.marker.{index}.color
 * - (layers.{index}.)pointRendering.{index}.marker.{index}.color.render
 * - (layers.{index}.)pointRendering.{index}.marker.{index}.color.mappings.{index}.then
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

      const colorHex = new ColorTranslator(
        `rgba(${color.red * 255}, ${color.green * 255}, ${color.blue * 255}, ${
          color.alpha
        })`
      ).HEXA;

      // If the color is fully opaque (AKA it ends with FF), we can remove the alpha channel
      const colorHexString = colorHex.endsWith("FF")
        ? colorHex.substring(0, 7)
        : colorHex;

      // TODO: Add color names, maybe convert to short-hand hex

      return [
        {
          label: colorHexString,
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
        /^(layers.\d+.)?lineRendering.\d+.color((.render)|(.mappings.\d+.then))?$/,
        /^(layers.\d+.)?lineRendering.\d+.fillColor((.render)|(.mappings.\d+.then))?$/,
        /^(layers.\d+.)?pointRendering.\d+.marker.\d+.color((.render)|(.mappings.\d+.then))?$/,
      ];

      regexes.forEach((regex) => {
        allPaths.forEach((path) => {
          if (regex.exec(path)) {
            const colorValue = getValueFromPath(text, pathToJSONPath(path));

            let colorRgba;
            try {
              colorRgba = new ColorTranslator(colorValue).RGBAObject;
            } catch (error) {
              console.error("Error translating color value:", error);
              return;
            }

            console.log(
              `Output color: ${colorRgba.R}, ${colorRgba.G}, ${colorRgba.B}, ${colorRgba.A}`
            );

            colors.push({
              color: new vscode.Color(
                colorRgba.R / 255,
                colorRgba.G / 255,
                colorRgba.B / 255,
                colorRgba.A ?? 1
              ),
              range: getStartEnd(text, pathToJSONPath(path)),
            });
          }
        });
      });

      return colors;
    },
  }
);
