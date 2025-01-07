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
import { getCursorPath, getRawCursorPath, getStartEnd } from "./utils/cursor";
import { getFilters, getTagRenderings } from "./utils/mapcomplete";
import { getValueFromPath } from "./utils/json";
import { JSONPath } from "jsonc-parser";
import { Cache } from "./utils/cache";

/**
 * Tag rendering completion provider
 *
 * This provider will provide a list of existing tagRenderings for autocompletion
 *
 * JSON path:
 * - (layers.{index}.(override).)tagRenderings.{index}(.builtin)
 * - overrideAll.tagRenderings.{index}(.builtin)
 * Also +/= characters around tagRenderings are supported
 */
export const tagRenderingCompletionProvider =
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

        console.log("tagRenderingCompletionProvider");
        const text = document.getText();
        const jsonPath = getCursorPath(text, position);

        // This technically also matches layers.1.tagRenderings+, and similar, but that's fine
        const regex =
          /^((layers\.\d+\.(override\.([+=])?)?)|(overrideAll\.))?tagRenderings(\+)?\.\d+(.builtin)?$/;
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
 *
 * This provider will provide a definition for tagRenderings, allowing users to jump to the tagRendering definition
 *
 * JSON path:
 * - (layers.{index}.(override).)tagRenderings.{index}(.builtin)
 * - overrideAll.tagRenderings.{index}(.builtin)
 * Also +/= characters around tagRenderings are supported
 */
export const tagRenderingDefinitionProvider =
  vscode.languages.registerDefinitionProvider(
    {
      language: "json",
      scheme: "file",
      pattern: "**/assets/*/*/*.json",
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

        // This technically also matches layers.1.tagRenderings+, and similar, but that's fine
        const regex =
          /^((layers\.\d+\.(override\.([+=])?)?)|(overrideAll\.))?tagRenderings(\+)?\.\d+(.builtin)?$/;

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

export const tagRenderingImplementationProvider =
  vscode.languages.registerImplementationProvider(
    {
      language: "json",
      scheme: "file",
      pattern: "**/assets/*/*/*.json",
    },
    {
      async provideImplementation(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
      ) {
        console.log("tagRenderingImplementationProvider");
        const text = document.getText();
        const jsonPath = getCursorPath(text, position);
        const rawJsonPath = getRawCursorPath(text, position);

        const regex = /^tagRenderings(\+)?\.\d+\.id$/;

        if (regex.exec(jsonPath)) {
          const tagRenderingId = getValueFromPath(text, rawJsonPath);
          const layerName = document.fileName.split("/").pop()?.split(".")[0];
          const to = `layers.${layerName}.tagRenderings.${tagRenderingId}`;

          try {
            const cache = await Cache.create();
            const references = cache.getReferences(to);

            if (references.length === 0) {
              return null;
            } else {
              // TODO: This is way too much to be executing at this time, most of this should be cached
              // TODO: Also, this seems to fail for the first time, but work for every subsequent time
              console.log(`Found ${references.length} references to ${to}`);

              const links: vscode.DefinitionLink[] = [];
              for (const reference of references) {
                const originType = reference.reference?.from.split(".")[0];
                const originName = reference.reference?.from.split(".")[1];

                // We need to open the file where the reference is located
                const originFile = await vscode.workspace.findFiles(
                  `assets/${originType}/${originName}/${originName}.json`
                );
                if (originFile.length === 0) {
                  continue;
                }

                const originText = await vscode.workspace.fs.readFile(
                  originFile[0]
                );
                const originTextString = new TextDecoder().decode(originText);
                const origin = JSON.parse(originTextString);

                let tagRenderings: unknown[] = [];
                let tagRenderingsPath: JSONPath = [];

                // Now we'll need to find the tagRenderings object, and its path
                if (originType === "themes") {
                  const parts = reference.reference?.from.split(".");
                  if (!parts) {
                    continue;
                  } else {
                    console.log("Parts", parts);
                    // Now we need to find the correct inline layer
                    const layerIndex = origin.layers.findIndex(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (layer: any) => layer.id === parts[3]
                    );

                    const path: JSONPath = [
                      parts[2],
                      layerIndex,
                      ...reference.jsonPath,
                    ];

                    console.log("Trying to get tagRenderings from theme", path);

                    const tagRenderingsFromOrigin = getValueFromPath(
                      originTextString,
                      path
                    );
                    if (!tagRenderingsFromOrigin) {
                      console.error(
                        "Could not find tagRenderings in theme",
                        originName
                      );
                      continue;
                    } else {
                      // Yaay, we found the tagRenderings
                      console.log("Found tagRenderings in theme", originName);
                      tagRenderings = tagRenderingsFromOrigin as unknown[];
                      tagRenderingsPath = path;
                    }
                  }
                } else if (originType === "layers") {
                  tagRenderings = origin.tagRenderings;
                  tagRenderingsPath = ["tagRenderings"];
                }

                // The index is actually a really complicated, because a reference could be a string or an object with a builtin property, which can be a string or a list of strings
                // Also if the reference is from an inline layer
                const tagRenderingIndex = tagRenderings.findIndex(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tr: any) => {
                    if (typeof tr === "string") {
                      return tr === reference.id;
                    } else if (typeof tr.builtin === "string") {
                      return tr.builtin === reference.id;
                    }
                    // } else if (tr.builtin) {
                    //   return tr.builtin.includes(reference.id);
                    // }
                  }
                );
                const path: JSONPath = [
                  ...tagRenderingsPath,
                  tagRenderingIndex,
                ];
                const startEnd = getStartEnd(originTextString, path);

                console.log(
                  `Pushing link from ${document.fileName} to ${originFile[0].path} at ${startEnd.start.line}.${startEnd.start.character} to ${startEnd.end.line}.${startEnd.end.character}`
                );

                links.push({
                  originSelectionRange: getStartEnd(text, rawJsonPath),
                  targetRange: startEnd,
                  targetUri: originFile[0],
                });
              }
              console.log(`Found ${links.length} implementations`);
              return links;
            }
          } catch (error) {
            console.error("Error get implementation", error);
          }
        }

        return null;
      },
    }
  );

/**
 * Filter completion provider
 *
 * This provider will provide a list of existing filters for autocompletion
 *
 * JSON path:
 * - (layers.{index}.)filter.{index}
 * - overrideAll.filter.{index}
 * Also +/= characters around filter are supported
 */
export const filterCompletionProvider =
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

        console.log("filterCompletionProvider");
        const text = document.getText();
        const jsonPath = getCursorPath(text, position);

        console.log(jsonPath);

        const regex =
          /^((layers\.\d+\.(override\.([+=])?)?)|(overrideAll\.))?filter(\+)?\.\d+$/;
        if (regex.exec(jsonPath)) {
          const filters = await getFilters();
          console.log(`Got ${filters.length} filters`);

          // Now we need to return the completion items
          return filters;
        }

        return [];
      },
    }
  );

/**
 * Filter definition provider
 *
 * This provider will provide a definition for filters, allowing users to jump to the filter definition
 *
 * JSON path:
 * - (layers.{index}.)filter.{index}
 * - overrideAll.filter.{index}
 * Also +/= characters around filter are supported
 */
export const filterDefinitionProvider =
  vscode.languages.registerDefinitionProvider(
    {
      language: "json",
      scheme: "file",
      pattern: "**/assets/*/*/*.json",
    },
    {
      async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        console.log("filterDefinitionProvider");
        const text = document.getText();
        const jsonPath = getCursorPath(text, position);
        const rawJsonPath = getRawCursorPath(text, position);

        const regex =
          /^((layers\.\d+\.(override\.([+=])?)?)|(overrideAll\.))?filter(\+)?\.\d+$/;

        if (regex.exec(jsonPath)) {
          const filter = getValueFromPath(text, rawJsonPath);

          if (typeof filter === "string") {
            console.log("Found reference to filter", filter);
            if (filter.indexOf(".") === -1) {
              console.log("This is a built-in filter");
              // This is a built-in filter
              // Read the built-in filters file
              const layerFile = await vscode.workspace.findFiles(
                "assets/layers/filters/filters.json"
              );
              if (layerFile.length === 0) {
                return null;
              }

              const layerText = await vscode.workspace.fs.readFile(
                layerFile[0]
              );
              const layerTextString = new TextDecoder().decode(layerText);
              const layer = JSON.parse(layerTextString);

              const filterIndex = layer.filter.findIndex(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (f: any) => f.id === filter
              );

              const path: JSONPath = ["filter", filterIndex];
              const startEnd = getStartEnd(layerTextString, path);

              const link: vscode.DefinitionLink = {
                targetUri: layerFile[0],
                targetRange: startEnd,
                originSelectionRange: getStartEnd(text, rawJsonPath),
              };

              return [link];
            } else {
              // This is a reference to a filter in another layer
              // We need to find the layer and the filter
              const layerName = filter.split(".")[0];
              const filterName = filter.split(".")[1];

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

              const filterIndex = layer.filter.findIndex(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (f: any) => f.id === filterName
              );

              const path: JSONPath = ["filter", filterIndex];
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
