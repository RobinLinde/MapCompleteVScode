/**
 * This file contains all functions related to caching the workspace
 */

import * as vscode from "vscode";
import { JSONPath } from "jsonc-parser";
import { getStartEnd } from "./cursor";

/**
 * Worker class to handle the cache creation and updates
 */
export class CacheWorker {
  /**
   * The extension context
   */
  private readonly context: vscode.ExtensionContext;

  /**
   * List of cache items
   */
  private cache: CacheItem[] = [];

  /**
   * Creates a new cache
   *
   * @param context The extension context
   * @returns Promise<Cache> The cache
   */
  public static async create(
    context: vscode.ExtensionContext
  ): Promise<CacheWorker> {
    const cache = new CacheWorker(context);
    await cache.scanWorkspace();
    return cache;
  }

  /**
   * Create a new cache
   *
   * @param context The extension context
   */
  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    // We probably want to create a fileSystemWatcher here
    // to listen for changes in the workspace
    this.createFileSystemWatcher();
  }

  /**
   * Saves the current cache to the storage as JSON
   * TODO: Find a more elegant way to do this
   */
  private save() {
    const jsonString = JSON.stringify(this.cache);
    // Save it in the cache.json file in the .cache folder in the workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (workspaceFolder) {
      const cacheUri = vscode.Uri.file(`${workspaceFolder}/.cache/cache.json`);
      vscode.workspace.fs.writeFile(cacheUri, Buffer.from(jsonString));
    } else {
      console.error("No workspace folder found");
    }
  }

  /**
   * Create a file system watcher
   */
  private createFileSystemWatcher() {
    const watcher = vscode.workspace.createFileSystemWatcher(
      "**/assets/**/*.json"
    );
    watcher.onDidChange(this.onChanged, this, this.context.subscriptions);
    watcher.onDidCreate(this.onCreated, this, this.context.subscriptions);
    watcher.onDidDelete(this.onDeleted, this, this.context.subscriptions);
  }

  private onChanged(uri: vscode.Uri) {
    this.saveFileToCache(uri);
  }

  private onCreated(uri: vscode.Uri) {
    this.saveFileToCache(uri);
  }

  private onDeleted(uri: vscode.Uri) {
    this.deleteFileFromCache(uri);
  }

  /**
   * Scans the workspace for all themes and layers
   */
  private async scanWorkspace() {
    const files = await vscode.workspace.findFiles("**/assets/**/*.json");
    for (const file of files) {
      this.saveFileToCache(file);
    }
  }

  /**
   * Scans a file, extracts all relevant information and saves it to the cache
   *
   * @param uri File URI
   */
  private saveFileToCache(uri: vscode.Uri) {
    // First, we determine what kind of file it is, and whether we actually care about it
    // If we don't care about it, we return early
    // Possible relevant patterns:
    // - ./assets/themes/{name}/{name}.json
    // - ./assets/layers/{name}/{name}.json

    const filePath = uri.fsPath;
    const regex = /\/assets\/(?<asset>themes|layers)\/([^/]+)\/\2\.json/;
    const match = regex.exec(filePath);
    const asset = match?.groups?.asset;
    if (!match) {
      return;
    } else {
      console.log("We care about this file", filePath);
      this.deleteFileFromCache(uri);

      // Determine what kind of file we're dealing with
      switch (asset) {
        case "themes":
          console.log("Theme found", filePath);
          this.saveThemeToCache(uri);
          break;
        case "layers":
          console.log("Layer found", filePath);
          this.saveLayerToCache(uri);
          break;
        default:
          console.error("Unknown asset type", filePath);
          break;
      }
    }
  }

  /**
   * Deletes a file from the cache
   *
   * @param uri File URI
   */
  private deleteFileFromCache(uri: vscode.Uri) {
    this.cache = this.cache.filter(
      (item) => item.filePath.fsPath !== uri.fsPath
    );

    this.save();
  }

  /**
   * Saves a theme to the cache
   *
   * @param filePath The file path
   */
  private async saveThemeToCache(uri: vscode.Uri) {
    const filePath = uri.fsPath;
    console.log("Saving theme to cache", filePath);
    /**
     * For now, we only care about the layer references in the theme
     */

    // Read the file
    const content = vscode.workspace.fs.readFile(uri);
    const text = new TextDecoder().decode(await content);
    const json = JSON.parse(text);

    // Determine some locations
    const from = `themes.${json.id}`;
    const fromFile = uri;

    // Look through the layers
    for (const layer of json.layers) {
      const layerIndex = json.layers.indexOf(layer);

      // Reference if it's a string
      if (typeof layer === "string") {
        // It is a reference
        console.log(`Reference found to layer ${layer} in ${filePath}`);

        const fromStartEnd = getStartEnd(text, ["layers", layerIndex]);
        const to = `layers.${layer}`;
        const toFile = await vscode.workspace.findFiles(
          `**/assets/layers/${layer}/${layer}.json`
        );

        this.cache.push({
          id: layer,
          filePath: uri,
          jsonPath: ["layers"],
          type: "reference",
          reference: {
            from: {
              id: from,
              uri: fromFile,
              range: [fromStartEnd.start, fromStartEnd.end],
            },
            to: {
              id: to,
              uri: toFile[0],
            },
            type: "layer",
          },
        });
      }
      // Builtin layer if we have a builtin property
      else if (layer.builtin) {
        if (typeof layer.builtin === "string") {
          // Single layer
          console.log(
            `Reference found to builtin layer ${layer.builtin} in ${filePath}`
          );

          const fromStartEnd = getStartEnd(text, [
            "layers",
            layerIndex,
            "builtin",
          ]);
          const to = `layers.${layer.builtin}`;
          const toFile = await vscode.workspace.findFiles(
            `**/assets/layers/${layer.builtin}/${layer.builtin}.json`
          );

          this.cache.push({
            id: layer.builtin,
            filePath: uri,
            jsonPath: ["layers"],
            type: "reference",
            reference: {
              from: {
                id: from,
                uri: fromFile,
                range: [fromStartEnd.start, fromStartEnd.end],
              },
              to: {
                id: to,
                uri: toFile[0],
              },
              type: "layer",
            },
          });
        } else {
          // Multiple layers
          for (const builtinLayer of layer.builtin) {
            console.log(
              `Reference found to builtin layer ${builtinLayer} in ${filePath}`
            );

            const builtinLayerIndex = layer.builtin.indexOf(builtinLayer);
            const fromStartEnd = getStartEnd(text, [
              "layers",
              layerIndex,
              "builtin",
              builtinLayerIndex,
            ]);
            const to = `layers.${builtinLayer}`;
            const toFile = await vscode.workspace.findFiles(
              `**/assets/layers/${builtinLayer}/${builtinLayer}.json`
            );

            this.cache.push({
              id: builtinLayer,
              filePath: uri,
              jsonPath: ["layers"],
              type: "reference",
              reference: {
                from: {
                  id: from,
                  uri: fromFile,
                  range: [fromStartEnd.start, fromStartEnd.end],
                },
                to: {
                  id: to,
                  uri: toFile[0],
                },
                type: "layer",
              },
            });
          }
        }
      }
      // Inline layer else
      else {
        console.log(`Found inline layer ${layer.id} in ${filePath}`);
        const layerText = JSON.stringify(layer);
        const from = `themes.${json.id}.layers.${layerIndex}`;
        await this.saveLayerTextToCache(layerText, uri, from, true, text);
      }
    }

    this.save();
    this.printCache();
  }

  /**
   * Saves a layer to the cache
   *
   * @param uri The URI of the layer
   */
  private async saveLayerToCache(uri: vscode.Uri) {
    if (uri.fsPath.endsWith("favourite.json")) {
      return;
    }

    // Read the file
    const content = vscode.workspace.fs.readFile(uri);
    const text = new TextDecoder().decode(await content);
    const uriPath = uri.path;
    const uriPathSplit = uriPath.split("/");
    const uriFileName = uriPathSplit[uriPathSplit.length - 1];
    const from = `layers.${uriFileName.split(".")[0]}`;

    await this.saveLayerTextToCache(text, uri, from);
  }

  /**
   * Save a layer to the cache, given the text of the layer
   *
   * @param text Text representation of layer
   * @param uri The URI of the layer file
   * @param from The theme or layer where the layer is from, e.g. layers.bicycle_rental or themes.cyclofix.layers.0
   * @param referencesOnly Whether to only save references, or also the tagRenderings and filters. This is useful for inline layers, because their filters and tagRenderings can't be reused
   * @param fullFileText The full text of the original theme file, used for calculating position
   */
  private async saveLayerTextToCache(
    text: string,
    uri: vscode.Uri,
    from: string,
    referencesOnly = false,
    fullFileText?: string
  ) {
    const filePath = uri.fsPath;
    console.log("Saving layer to cache", filePath);
    /**
     * For now, we only care about the tagRenderings and filters in the layer
     */
    const json = JSON.parse(text);

    // Check if this layer doesn't have a special source, or uses a geoJson source
    if (json.source === "special" || json.source?.geoJson) {
      console.log("Layer has a special source, only saving references");
      referencesOnly = true;
    }

    // Look through the tagRenderings, if the layer has any
    if (json.tagRenderings) {
      try {
        await this.saveTagRenderingsToCache(
          text,
          from,
          uri,
          referencesOnly,
          fullFileText
        );
      } catch (error) {
        console.error(`Error saving tagRenderings for ${from}`, error);
      }
    } else {
      console.log("No tagRenderings found in", filePath);
    }

    if (json.filter) {
      // Look through the filters
      try {
        await this.saveFiltersToCache(
          text,
          from,
          uri,
          referencesOnly,
          fullFileText
        );
      } catch (error) {
        console.error(`Error saving filters for ${from}`, error);
      }
    } else {
      console.log("No filters found in", filePath);
    }

    this.save();
    this.printCache();
  }

  /**
   * Save tag renderings to cache
   * TODO: references for tagRenderings can also be a label/group, which we don't support yet
   *
   * @param text Text representation of layer
   * @param from The theme or layer where the layer is from, e.g. layers.bicycle_rental or themes.cyclofix.layers.0
   * @param fromUri URI of the layer file
   * @param referencesOnly Whether to only save references, or also the tagRenderings and filters. This is useful for inline layers, because their filters and tagRenderings can't be reused
   * @param fullFileText The full text of the original theme file, used for calculating position
   */
  private async saveTagRenderingsToCache(
    text: string,
    from: string,
    fromUri: vscode.Uri,
    referencesOnly = false,
    fullFileText?: string
  ) {
    const json = JSON.parse(text);

    for (const tagRendering of json.tagRenderings) {
      const tagRenderingReferenceIndex =
        json.tagRenderings.indexOf(tagRendering);

      // Check if it is a string and not an object
      if (typeof tagRendering === "string") {
        // It is a reference
        console.log(
          `Reference found to tagRendering ${tagRendering} in ${from}`
        );

        // The range is dependent on whether we're dealing with a full file or not
        const path = fullFileText
          ? [
              from.split(".")[2],
              parseInt(from.split(".")[3]),
              "tagRenderings",
              tagRenderingReferenceIndex,
            ]
          : ["tagRenderings", tagRenderingReferenceIndex];
        const fromStartEnd = fullFileText
          ? getStartEnd(fullFileText, path)
          : getStartEnd(text, path);
        const to = tagRendering.includes(".")
          ? `layers.${tagRendering.split(".")[0]}.tagRenderings.${
              tagRendering.split(".")[1]
            }`
          : `layers.questions.tagRenderings.${tagRendering}`;
        const toFileName = tagRendering.includes(".")
          ? `**/assets/layers/${tagRendering.split(".")[0]}/${
              tagRendering.split(".")[0]
            }.json`
          : `**/assets/layers/questions/questions.json`;
        const toFile = await vscode.workspace.findFiles(toFileName);

        // Read toFile and get the text
        const toContent = await vscode.workspace.fs.readFile(toFile[0]);
        const toText = new TextDecoder().decode(toContent);
        const toJson = JSON.parse(toText);
        const trIndex = toJson.tagRenderings.findIndex(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (tr: any) => tr.id === tagRendering.split(".")?.pop()
        );
        const toRange = getStartEnd(toText, ["tagRenderings", trIndex]);

        this.cache.push({
          id: tagRendering,
          filePath: fromUri,
          jsonPath: ["tagRenderings"],
          type: "reference",
          reference: {
            from: {
              id: from,
              uri: fromUri,
              range: [fromStartEnd.start, fromStartEnd.end],
            },
            to: {
              id: to,
              uri: toFile[0],
              range: [toRange.start, toRange.end],
            },
            type: "tagRendering",
          },
        });
      } else if (typeof tagRendering === "object") {
        // This is a tagRendering, or a reference to one, but with an override
        if (tagRendering.builtin) {
          // This is a reference to a built-in tagRendering (or multiple ones)
          if (typeof tagRendering.builtin === "string") {
            // Single tagRendering reference
            console.log(
              `Reference found to builtin tagRendering ${tagRendering.builtin} in ${from}`
            );
            // The range is dependent on whether we're dealing with a full file or not
            const path = fullFileText
              ? [
                  from.split(".")[2],
                  parseInt(from.split(".")[3]),
                  "tagRenderings",
                  tagRenderingReferenceIndex,
                  "builtin",
                ]
              : ["tagRenderings", tagRenderingReferenceIndex, "builtin"];
            const fromStartEnd = fullFileText
              ? getStartEnd(fullFileText, path)
              : getStartEnd(text, path);
            const to = tagRendering.builtin.includes(".")
              ? `layers.${tagRendering.builtin.split(".")[0]}.tagRenderings.${
                  tagRendering.builtin.split(".")[1]
                }`
              : `layers.questions.tagRenderings.${tagRendering}`;
            const toFileName = tagRendering.builtin.includes(".")
              ? `**/assets/layers/${tagRendering.builtin.split(".")[0]}/${
                  tagRendering.builtin.split(".")[0]
                }.json`
              : `**/assets/layers/questions/questions.json`;
            const toFile = await vscode.workspace.findFiles(toFileName);

            // Read toFile and get the text
            const toContent = await vscode.workspace.fs.readFile(toFile[0]);
            const toText = new TextDecoder().decode(toContent);
            const toJson = JSON.parse(toText);
            const trIndex = toJson.tagRenderings.findIndex(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (tr: any) => tr.id === tagRendering.builtin.split(".")?.pop()
            );
            const toRange = getStartEnd(toText, ["tagRenderings", trIndex]);

            this.cache.push({
              id: tagRendering.builtin,
              filePath: fromUri,
              jsonPath: ["tagRenderings"],
              type: "reference",
              reference: {
                from: {
                  id: from,
                  uri: fromUri,
                  range: [fromStartEnd.start, fromStartEnd.end],
                },
                to: {
                  id: to,
                  uri: toFile[0],
                  range: [toRange.start, toRange.end],
                },
                type: "tagRendering",
              },
            });
          } else {
            // Multiple tagRenderings
            for (const builtinTagRendering of tagRendering.builtin) {
              console.log(
                `Reference found to builtin tagRendering ${builtinTagRendering} in ${from}`
              );
              // The range depends on whether we're dealing with a full file or not
              const fromStartEnd = fullFileText
                ? getStartEnd(fullFileText, [
                    ...from.split("."),
                    "tagRenderings",
                    json.tagRenderings.indexOf(tagRendering),
                  ])
                : getStartEnd(text, [
                    "tagRenderings",
                    json.tagRenderings.indexOf(tagRendering),
                  ]);
              const to = builtinTagRendering.includes(".")
                ? `layers.${builtinTagRendering.split(".")[0]}.tagRenderings.${
                    builtinTagRendering.split(".")[1]
                  }`
                : `layers.questions.tagRenderings.${builtinTagRendering}`;
              const toFileName = builtinTagRendering.includes(".")
                ? `**/assets/layers/${builtinTagRendering.split(".")[0]}/${
                    builtinTagRendering.split(".")[0]
                  }.json`
                : `**/assets/layers/questions/questions.json`;
              const toFile = await vscode.workspace.findFiles(toFileName);

              // Read toFile and get the text
              const toContent = await vscode.workspace.fs.readFile(toFile[0]);
              const toText = new TextDecoder().decode(toContent);
              const toJson = JSON.parse(toText);
              const trIndex = toJson.tagRenderings.findIndex(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (tr: any) => tr.id === builtinTagRendering.split(".")?.pop()
              );
              const toRange = getStartEnd(toText, ["tagRenderings", trIndex]);

              this.cache.push({
                id: builtinTagRendering,
                filePath: fromUri,
                jsonPath: ["tagRenderings"],
                type: "reference",
                reference: {
                  from: {
                    id: from,
                    uri: fromUri,
                    range: [fromStartEnd.start, fromStartEnd.end],
                  },
                  to: {
                    id: to,
                    uri: toFile[0],
                    range: [toRange.start, toRange.end],
                  },
                  type: "tagRendering",
                },
              });
            }
          }
        } else if (!referencesOnly) {
          // We've now had all possible references, so now we must have an acutal tagRendering
          console.log(`TagRendering found in ${from}`);
          this.cache.push({
            id: `${json.id}.${tagRendering.id}`,
            filePath: fromUri,
            jsonPath: ["tagRenderings"],
            type: "tagRendering",
          });
        }
      }
    }
  }

  /**
   * Save filters to cache
   *
   * @param text Text representation of layer
   * @param from The theme or layer where the layer is from, e.g. layers.bicycle_rental or themes.cyclofix.layers.0
   * @param fromUri URI of the layer file
   * @param referencesOnly Whether to only save references, or also the tagRenderings and filters. This is useful for inline layers, because their filters and tagRenderings can't be reused
   * @param fullFileText The full text of the original theme file, used for calculating position
   */
  private async saveFiltersToCache(
    text: string,
    from: string,
    fromUri: vscode.Uri,
    referencesOnly = false,
    fullFileText?: string
  ) {
    const json = JSON.parse(text);

    for (const filter of json.filter) {
      const filterReferenceIndex = json.filter.indexOf(filter);

      // Check if it is a string and not an object
      if (typeof filter === "string") {
        // It is a reference
        console.log(`Reference found to filter ${filter} in ${from}`);

        // The range is dependent on whether we're dealing with a full file or not
        const path = fullFileText
          ? [
              from.split(".")[2],
              parseInt(from.split(".")[3]),
              "filter",
              filterReferenceIndex,
            ]
          : ["filter", filterReferenceIndex];
        const fromStartEnd = fullFileText
          ? getStartEnd(fullFileText, path)
          : getStartEnd(text, path);
        const filterId = filter.includes(".") ? filter.split(".")[1] : filter;
        const to = filter.includes(".")
          ? `layers.${filter.split(".")[0]}`
          : `layers.filters`;
        // Now we'll need to determine what file we need to look in
        const toFileName = filter.includes(".")
          ? `**/assets/layers/${filter.split(".")[0]}/${
              filter.split(".")[0]
            }.json`
          : `**/assets/layers/filters/filters.json`;
        const toFile = await vscode.workspace.findFiles(toFileName);
        const toContent = await vscode.workspace.fs.readFile(toFile[0]);
        const toText = new TextDecoder().decode(toContent);
        const toJson = JSON.parse(toText);
        const toFilterIndex = toJson.filter.findIndex(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (f: any) => f.id === filterId
        );

        if (toFilterIndex === -1) {
          console.error(`Filter ${filter} not found`);
          continue;
        }
        const toRange = getStartEnd(toText, ["filter", toFilterIndex]);

        this.cache.push({
          id: filter,
          filePath: fromUri,
          jsonPath: ["filters"],
          type: "reference",
          reference: {
            from: {
              id: from,
              uri: fromUri,
              range: [fromStartEnd.start, fromStartEnd.end],
            },
            to: {
              id: to,
              uri: toFile[0],
              range: [toRange.start, toRange.end],
            },
            type: "filter",
          },
        });
      } else if (typeof filter === "object" && !referencesOnly) {
        // This is a filter, which can be reused
        console.log(`Filter found in ${from}`);
        this.cache.push({
          id: `${json.id}.${filter.id}`,
          filePath: fromUri,
          jsonPath: ["filters"],
          type: "filter",
        });
      }
    }
  }

  /**
   * Print the current cache state
   * TODO: This probably needs to be removed at some point
   */
  public printCache() {
    console.log("Current cache state:", this.cache);
  }
}

/**
 * Cache for interacting with the cache
 */
export class Cache {
  private cache: CacheItem[] = [];

  public static async create() {
    const cache = new Cache();
    await cache.loadCache();
    return cache;
  }

  /**
   * Load the cache from the .cache/cache.json file
   * TODO: Find a more elegant way to do this
   */
  private async loadCache() {
    // Get the cache from the .cache/cache.json file in the workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (workspaceFolder) {
      const cacheUri = vscode.Uri.file(`${workspaceFolder}/.cache/cache.json`);
      const cache = await vscode.workspace.fs.readFile(cacheUri);
      const cacheString = new TextDecoder().decode(cache);
      this.cache = JSON.parse(cacheString);
    } else {
      console.error("No workspace folder found");
      throw new Error("No workspace folder found");
    }
  }

  /**
   * Get all tag renderings from the cache
   *
   * @returns List of CompletionItems for tagRenderings
   */
  public getTagRenderings(): vscode.CompletionItem[] {
    console.log("Getting tag renderings from cache");
    const tagRenderings: vscode.CompletionItem[] = [];
    for (const item of this.cache) {
      if (item.type === "tagRendering") {
        if (item.id.startsWith("questions.")) {
          const completionItem = new vscode.CompletionItem(
            item.id.replace("questions.", ""),
            vscode.CompletionItemKind.Value
          );
          // To give built-in tagRenderings a higher priority, we sort them to the top
          completionItem.sortText = `#${item.id}`;
          tagRenderings.push(completionItem);
        } else {
          tagRenderings.push(
            new vscode.CompletionItem(item.id, vscode.CompletionItemKind.Value)
          );
        }
      }
    }
    return tagRenderings;
  }

  /**
   * Get all filters from the cache
   */
  public getFilters(): vscode.CompletionItem[] {
    console.log("Getting filters from cache");
    const filters: vscode.CompletionItem[] = [];
    for (const item of this.cache) {
      if (item.type === "filter") {
        if (item.id.startsWith("filters.")) {
          const completionItem = new vscode.CompletionItem(
            item.id.replace("filters.", ""),
            vscode.CompletionItemKind.Value
          );
          // To give built-in filters a higher priority, we sort them to the top
          completionItem.sortText = `#${item.id}`;
          filters.push(completionItem);
        } else {
          filters.push(
            new vscode.CompletionItem(item.id, vscode.CompletionItemKind.Value)
          );
        }
      }
    }
    return filters;
  }

  /**
   * Get all references to a specific item
   *
   * @param to Item to get references for (e.g. layers.bicycle_rental)
   * @returns List of references
   */
  public getReferences(to: string): CacheItem[] {
    return this.cache.filter((item) => {
      if (item.type === "reference") {
        return item.reference?.to.id === to;
      }
      return false;
    });
  }
}

/**
 * A cached item
 * Can be a tagRendering or filter from a(n) (inline) layer
 * Can also be a reference between files
 */
interface CacheItem {
  /**
   * Where the item is defined in the workspace
   */
  filePath: vscode.Uri;

  /**
   * The JSON path to the item in the file
   */
  jsonPath: JSONPath;

  /**
   * What kind of item it is
   */
  type: "tagRendering" | "filter" | "reference";

  /**
   * The ID of the item
   *
   * When we need to reuse an items in a configuration, we can use the ID
   * This does mean the ID definitely doesn't have to be unique, because when this is a reference,
   * the ID is the same as the reference ID and items can be reused by multiple themes or layers
   */
  id: string;

  /**
   * In case of a reference, this contains the reference
   */
  reference?: Reference;
}

/**
 * A reference between two items
 */
interface Reference {
  /**
   * The place where the item is being used (eg. themes.cyclofix)
   */
  from: ReferenceDetail;

  /**
   * The place where the item is defined (eg. layers.bicycle_rental)
   */
  to: ReferenceDetail;

  /**
   * The type of item being referenced/reused
   */
  type: "tagRendering" | "filter" | "layer";
}

interface ReferenceDetail {
  /**
   * The path of the file for this side of the reference
   *
   * @example layers.bicycle_rental
   * @example layers.questions.tagRenderings.name
   * @example themes.cyclofix
   */
  id: string;

  /**
   * The URI of the file for this side of the reference
   */
  uri?: vscode.Uri;

  /**
   * The range of the reference in the file
   * Useful for highlighting the reference in the file
   *
   * Only defined when referencing to a part of a file
   */
  range?: [ReferencePosition, ReferencePosition];
}

interface ReferencePosition {
  character: number;
  line: number;
}
