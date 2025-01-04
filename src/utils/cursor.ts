/**
 * Utility functions related to vscode cursor position and JSON paths
 */

import * as vscode from "vscode";
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
