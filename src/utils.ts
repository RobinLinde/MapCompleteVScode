import * as vscode from "vscode";
import * as path from "path";
import {
  findNodeAtLocation,
  getLocation,
  JSONPath,
  parseTree,
} from "jsonc-parser";

/**
 * Utility function to get the JSON path at the cursor position, separated by dots
 *
 * @param jsonText Original unparsed JSON text
 * @param position VScode cursor position
 * @returns JSON path as a string, separated by dots
 */
export function getCursorPath(
  jsonText: string,
  position: vscode.Position
): string {
  return getRawCursorPath(jsonText, position).join(".");
}

/**
 * Utility function to get the JSON path at the cursor position
 *
 * @param jsonText Original unparsed JSON text
 * @param position VScode cursor position
 * @returns JSON path as an array of strings
 */
export function getRawCursorPath(
  jsonText: string,
  position: vscode.Position
): JSONPath {
  const offset = positionToOffset(jsonText, position);
  const location = getLocation(jsonText, offset);
  return location.path;
}

/**
 * Utility function to convert a VScode position to a numeric offset
 *
 * @param text Original text content
 * @param position VScode cursor position
 * @returns Offset
 */
function positionToOffset(text: string, position: vscode.Position): number {
  const lines = text.split("\n");
  let offset = 0;
  for (let i = 0; i < position.line; i++) {
    offset += lines[i].length + 1; // +1 for the newline character
  }
  offset += position.character;
  return offset;
}

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
 * Function to get a range of a JSON path
 * Useful for creating document links
 *
 * @param json file content
 * @param path JSON path
 * @returns Range of the path
 */
export function getStartEnd(json: string, path: JSONPath): vscode.Range {
  const rootNode = parseTree(json);
  if (!rootNode) {
    return new vscode.Range(0, 0, 0, 0);
  } else {
    const node = findNodeAtLocation(rootNode, path);
    if (!node) {
      return new vscode.Range(0, 0, 0, 0);
    } else {
      return new vscode.Range(
        offsetToPosition(json, node.offset + 1),
        offsetToPosition(json, node.offset + node.length - 1)
      );
    }
  }
}

/**
 * Utility function to convert an offset to a position
 *
 * @param text Text content
 * @param offset Offset
 * @returns Position
 */
function offsetToPosition(text: string, offset: number): vscode.Position {
  const lines = text.split("\n");
  let currentOffset = 0;
  for (let i = 0; i < lines.length; i++) {
    if (currentOffset + lines[i].length + 1 >= offset) {
      return new vscode.Position(i, offset - currentOffset);
    }
    currentOffset += lines[i].length + 1;
  }
  return new vscode.Position(0, 0);
}

/**
 * Utility function to get the value of a JSON path
 *
 * @param json Original JSON content
 * @param path JSON path
 * @returns Value of the path
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getValueFromPath(json: string, path: JSONPath): any {
  console.log("getValueFromPath", path);
  const rootNode = parseTree(json);
  if (!rootNode) {
    console.log("Root node not found");
    return undefined;
  } else {
    console.log("Root node found");
    const node = findNodeAtLocation(rootNode, path);
    if (!node) {
      return undefined;
    } else {
      console.log(
        "Substring",
        json.substring(node.offset, node.offset + node.length)
      );
      return JSON.parse(json.substring(node.offset, node.offset + node.length));
    }
  }
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
