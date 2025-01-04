/**
 * This file contains some function related to interaction with MapComplete data in the editor
 */

import * as vscode from "vscode";
import * as path from "path";

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
 * Utility function to get the tagRenderings from the questions layer
 * //TODO: This should get ALL tagRenderings, not just from the questions layer
 *
 * @returns List of CompletionItems for tagRenderings
 */
export async function getTagRenderings(): Promise<vscode.CompletionItem[]> {
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
 * Utility function to get the filters from the filters layer
 * //TODO: This should get ALL filters, not just from the filters layer
 *
 * @returns List of CompletionItems for tagRenderings
 */
export async function getFilters(): Promise<vscode.CompletionItem[]> {
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
