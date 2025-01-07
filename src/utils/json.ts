/**
 * Utility functions to work with JSON content and paths
 */

import { JSONPath, findNodeAtLocation, parseTree } from "jsonc-parser";

/**
 * Utility function to get the value of a JSON path
 *
 * @param json Original JSON content
 * @param path JSON path
 * @returns Value of the path
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getValueFromPath(json: string, path: JSONPath): any {
  const rootNode = parseTree(json);
  if (!rootNode) {
    return undefined;
  } else {
    const node = findNodeAtLocation(rootNode, path);
    if (!node) {
      return undefined;
    } else {
      return JSON.parse(json.substring(node.offset, node.offset + node.length));
    }
  }
}

/**
 * Utility function to convert a string path to a JSON path
 *
 * @param path String path, separated by dots
 * @returns JSON path
 */
export function pathToJSONPath(path: string): JSONPath {
  return path.split(".").map((str) => {
    return isNaN(parseInt(str)) ? str : parseInt(str);
  });
}
