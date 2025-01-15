/**
 * This file contains some function related to interaction with MapComplete data in the editor
 */

import * as vscode from "vscode";
import * as path from "path";
import { Cache } from "./cache";

/**
 * Function to get all available layers on disk
 *
 * In essence, we look for folders under the assets/layers directory
 * and return the names of the folders
 * @returns List of layer names
 */
export async function getAvailableLayers(): Promise<string[]> {
  const layers: string[] = [];
  let files = await vscode.workspace.findFiles(
    "assets/layers/**/*.json",
    "**/node_modules/**"
  );

  files = files.filter((file) => {
    return !file.fsPath.includes("license_info");
  });

  for (const file of files) {
    const layerName = path.basename(path.dirname(file.fsPath));
    layers.push(layerName);
  }

  return layers;
}

/**
 * Utility function to get the tagRenderings from all available layers
 *
 * This function first tries to get all of the tagRenderings from the cache, and if that fails, it falls back to the questions.json file
 *
 * @returns List of CompletionItems for tagRenderings
 */
export async function getTagRenderings(): Promise<vscode.CompletionItem[]> {
  // First, we try to get the tagRenderings from the cache, if it is enabled
  // If the cache is not available, instead return the tagRenderings from the questions layer

  if (!vscode.workspace.getConfiguration("mapcomplete").get("caching")) {
    return getTagRenderingsUncached();
  }

  try {
    const cache = await Cache.create();
    return cache.getTagRenderings();
  } catch (error) {
    console.error(
      "Error getting tagRenderings from cache, falling back to questions.json",
      error
    );

    return getTagRenderingsUncached();
  }
}

/**
 * Utility function to get the tagRenderings from the questions layer
 *
 * @returns List of CompletionItems for tagRenderings
 */
async function getTagRenderingsUncached(): Promise<vscode.CompletionItem[]> {
  const tagRenderings: vscode.CompletionItem[] = [];

  // Open the questions layer file
  const questionsFile = await vscode.workspace.findFiles(
    "assets/layers/questions/questions.json",
    "**/node_modules/**"
  );

  if (questionsFile.length === 0) {
    console.error("questions.json not found");
    return [];
  }

  const content = await vscode.workspace.fs.readFile(questionsFile[0]);
  const questions = JSON.parse(new TextDecoder().decode(content));

  for (const tagRendering of questions.tagRenderings) {
    tagRenderings.push(
      new vscode.CompletionItem(
        tagRendering.id,
        vscode.CompletionItemKind.Value
      )
    );
  }

  return tagRenderings;
}

/**
 * Utility function to get the filters from all available layers
 *
 * This function first tries to get all of the filters from the cache, and if that fails, it falls back to the filters.json file
 *
 * @returns List of CompletionItems for tagRenderings
 */
export async function getFilters(): Promise<vscode.CompletionItem[]> {
  // First, we try to get the filters from the cache, if it is enabled
  // If the cache is not available, instead return the filters from the filters layer

  if (!vscode.workspace.getConfiguration("mapcomplete").get("caching")) {
    return getFiltersUncached();
  }
  try {
    const cache = await Cache.create();
    return cache.getFilters();
  } catch (error) {
    console.error(
      "Error getting filters from cache, falling back to filters.json",
      error
    );

    return getFiltersUncached();
  }
}

/**
 * Utility function to get the filters from the filters layer
 *
 * @returns List of CompletionItems for tagRenderings
 */
async function getFiltersUncached(): Promise<vscode.CompletionItem[]> {
  const filtersList: vscode.CompletionItem[] = [];

  // Open the filters layer file
  const filtersFile = await vscode.workspace.findFiles(
    "assets/layers/filters/filters.json",
    "**/node_modules/**"
  );

  if (filtersFile.length === 0) {
    console.error("filters.json not found");
    return [];
  }

  const content = await vscode.workspace.fs.readFile(filtersFile[0]);
  const filters = JSON.parse(new TextDecoder().decode(content));

  for (const filter of filters.filter) {
    filtersList.push(
      new vscode.CompletionItem(filter.id, vscode.CompletionItemKind.Value)
    );
  }

  return filtersList;
}
