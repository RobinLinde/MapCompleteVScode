/**
 * Some utilities to works with colors, mainly color names
 */

import { Color as vscodeColor } from "vscode";

/**
 * Representation of a color, contains hex and rgb values
 */
interface Color {
  /**
   * CSS color name
   */
  name: string;

  /**
   * Hex representation of the color
   */
  hex: string;

  /**
   * Red value (0-255)
   */
  r: number;

  /**
   * Green value (0-255)
   */
  g: number;

  /**
   * Blue value (0-255)
   */
  b: number;
}

/**
 * Find a color by its hex value
 *
 * @param hex Hex color
 * @returns Color object, if found
 */
export function findHexColorName(hex: string): Color | undefined {
  return colors.find((color) => color.hex === hex.toLowerCase());
}

/**
 * Find a color by its name
 *
 * @param name Color name
 * @returns Color object, if found
 */
export function findHexColor(name: string): Color | undefined {
  return colors.find((color) => color.name === name.toLowerCase());
}

/**
 * Convert a VSCode color to a hex string
 *
 * @param color VSCode color
 * @returns Hex representation of the color
 */
export function vsCodeToHex(color: vscodeColor): string {
  const red = Math.round(color.red * 255)
    .toString(16)
    .padStart(2, "0");
  const green = Math.round(color.green * 255)
    .toString(16)
    .padStart(2, "0");
  const blue = Math.round(color.blue * 255)
    .toString(16)
    .padStart(2, "0");
  const alpha = Math.round(color.alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${red}${green}${blue}${alpha}`;
}

/**
 * Convert a color from a MapComplete JSON to a VSCode color
 *
 * Supports HEX (3, 6 or 8 characters) and color names
 *
 * @param color Color from MapComplete JSON
 */
export function mapCompleteToVScode(color: string): vscodeColor | undefined {
  // First check if we have a hex color
  if (color.startsWith("#")) {
    // Check if we have 3, 6 or 8 defined characters
    switch (color.length) {
      case 4:
        return new vscodeColor(
          parseInt(color.substring(1, 2), 16) / 255,
          parseInt(color.substring(2, 3), 16) / 255,
          parseInt(color.substring(3, 4), 16) / 255,
          1
        );
      case 7:
        return new vscodeColor(
          parseInt(color.substring(1, 3), 16) / 255,
          parseInt(color.substring(3, 5), 16) / 255,
          parseInt(color.substring(5, 7), 16) / 255,
          1
        );
      case 9:
        return new vscodeColor(
          parseInt(color.substring(1, 3), 16) / 255,
          parseInt(color.substring(3, 5), 16) / 255,
          parseInt(color.substring(5, 7), 16) / 255,
          parseInt(color.substring(7, 9), 16) / 255
        );
      default:
        return undefined;
    }
  } else {
    // Look for a color name
    const namedColor = findHexColor(color);

    if (namedColor) {
      return new vscodeColor(
        namedColor.r / 255,
        namedColor.g / 255,
        namedColor.b / 255,
        1
      );
    } else {
      return undefined;
    }
  }
}

/**
 * List of all named colors
 */
const colors: Color[] = [
  {
    name: "aliceblue",
    hex: "#f0f8ff",
    r: 240,
    g: 248,
    b: 255,
  },
  {
    name: "antiquewhite",
    hex: "#faebd7",
    r: 250,
    g: 235,
    b: 215,
  },
  {
    name: "aqua",
    hex: "#00ffff",
    r: 0,
    g: 255,
    b: 255,
  },
  {
    name: "aquamarine",
    hex: "#7fffd4",
    r: 127,
    g: 255,
    b: 212,
  },
  {
    name: "azure",
    hex: "#f0ffff",
    r: 240,
    g: 255,
    b: 255,
  },
  {
    name: "beige",
    hex: "#f5f5dc",
    r: 245,
    g: 245,
    b: 220,
  },
  {
    name: "bisque",
    hex: "#ffe4c4",
    r: 255,
    g: 228,
    b: 196,
  },
  {
    name: "black",
    hex: "#000000",
    r: 0,
    g: 0,
    b: 0,
  },
  {
    name: "blanchedalmond",
    hex: "#ffebcd",
    r: 255,
    g: 235,
    b: 205,
  },
  {
    name: "blue",
    hex: "#0000ff",
    r: 0,
    g: 0,
    b: 255,
  },
  {
    name: "blueviolet",
    hex: "#8a2be2",
    r: 138,
    g: 43,
    b: 226,
  },
  {
    name: "brown",
    hex: "#a52a2a",
    r: 165,
    g: 42,
    b: 42,
  },
  {
    name: "burlywood",
    hex: "#deb887",
    r: 222,
    g: 184,
    b: 135,
  },
  {
    name: "cadetblue",
    hex: "#5f9ea0",
    r: 95,
    g: 158,
    b: 160,
  },
  {
    name: "chartreuse",
    hex: "#7fff00",
    r: 127,
    g: 255,
    b: 0,
  },
  {
    name: "chocolate",
    hex: "#d2691e",
    r: 210,
    g: 105,
    b: 30,
  },
  {
    name: "coral",
    hex: "#ff7f50",
    r: 255,
    g: 127,
    b: 80,
  },
  {
    name: "cornflowerblue",
    hex: "#6495ed",
    r: 100,
    g: 149,
    b: 237,
  },
  {
    name: "cornsilk",
    hex: "#fff8dc",
    r: 255,
    g: 248,
    b: 220,
  },
  {
    name: "crimson",
    hex: "#dc143c",
    r: 220,
    g: 20,
    b: 60,
  },
  {
    name: "cyan",
    hex: "#00ffff",
    r: 0,
    g: 255,
    b: 255,
  },
  {
    name: "darkblue",
    hex: "#00008b",
    r: 0,
    g: 0,
    b: 139,
  },
  {
    name: "darkcyan",
    hex: "#008b8b",
    r: 0,
    g: 139,
    b: 139,
  },
  {
    name: "darkgoldenrod",
    hex: "#b8860b",
    r: 184,
    g: 134,
    b: 11,
  },
  {
    name: "darkgray",
    hex: "#a9a9a9",
    r: 169,
    g: 169,
    b: 169,
  },
  {
    name: "darkgreen",
    hex: "#006400",
    r: 0,
    g: 100,
    b: 0,
  },
  {
    name: "darkgrey",
    hex: "#a9a9a9",
    r: 169,
    g: 169,
    b: 169,
  },
  {
    name: "darkkhaki",
    hex: "#bdb76b",
    r: 189,
    g: 183,
    b: 107,
  },
  {
    name: "darkmagenta",
    hex: "#8b008b",
    r: 139,
    g: 0,
    b: 139,
  },
  {
    name: "darkolivegreen",
    hex: "#556b2f",
    r: 85,
    g: 107,
    b: 47,
  },
  {
    name: "darkorange",
    hex: "#ff8c00",
    r: 255,
    g: 140,
    b: 0,
  },
  {
    name: "darkorchid",
    hex: "#9932cc",
    r: 153,
    g: 50,
    b: 204,
  },
  {
    name: "darkred",
    hex: "#8b0000",
    r: 139,
    g: 0,
    b: 0,
  },
  {
    name: "darksalmon",
    hex: "#e9967a",
    r: 233,
    g: 150,
    b: 122,
  },
  {
    name: "darkseagreen",
    hex: "#8fbc8f",
    r: 143,
    g: 188,
    b: 143,
  },
  {
    name: "darkslateblue",
    hex: "#483d8b",
    r: 72,
    g: 61,
    b: 139,
  },
  {
    name: "darkslategray",
    hex: "#2f4f4f",
    r: 47,
    g: 79,
    b: 79,
  },
  {
    name: "darkslategrey",
    hex: "#2f4f4f",
    r: 47,
    g: 79,
    b: 79,
  },
  {
    name: "darkturquoise",
    hex: "#00ced1",
    r: 0,
    g: 206,
    b: 209,
  },
  {
    name: "darkviolet",
    hex: "#9400d3",
    r: 148,
    g: 0,
    b: 211,
  },
  {
    name: "deeppink",
    hex: "#ff1493",
    r: 255,
    g: 20,
    b: 147,
  },
  {
    name: "deepskyblue",
    hex: "#00bfff",
    r: 0,
    g: 191,
    b: 255,
  },
  {
    name: "dimgray",
    hex: "#696969",
    r: 105,
    g: 105,
    b: 105,
  },
  {
    name: "dimgrey",
    hex: "#696969",
    r: 105,
    g: 105,
    b: 105,
  },
  {
    name: "dodgerblue",
    hex: "#1e90ff",
    r: 30,
    g: 144,
    b: 255,
  },
  {
    name: "firebrick",
    hex: "#b22222",
    r: 178,
    g: 34,
    b: 34,
  },
  {
    name: "floralwhite",
    hex: "#fffaf0",
    r: 255,
    g: 250,
    b: 240,
  },
  {
    name: "forestgreen",
    hex: "#228b22",
    r: 34,
    g: 139,
    b: 34,
  },
  {
    name: "fuchsia",
    hex: "#ff00ff",
    r: 255,
    g: 0,
    b: 255,
  },
  {
    name: "gainsboro",
    hex: "#dcdcdc",
    r: 220,
    g: 220,
    b: 220,
  },
  {
    name: "ghostwhite",
    hex: "#f8f8ff",
    r: 248,
    g: 248,
    b: 255,
  },
  {
    name: "gold",
    hex: "#ffd700",
    r: 255,
    g: 215,
    b: 0,
  },
  {
    name: "goldenrod",
    hex: "#daa520",
    r: 218,
    g: 165,
    b: 32,
  },
  {
    name: "gray",
    hex: "#808080",
    r: 128,
    g: 128,
    b: 128,
  },
  {
    name: "green",
    hex: "#008000",
    r: 0,
    g: 128,
    b: 0,
  },
  {
    name: "greenyellow",
    hex: "#adff2f",
    r: 173,
    g: 255,
    b: 47,
  },
  {
    name: "grey",
    hex: "#808080",
    r: 128,
    g: 128,
    b: 128,
  },
  {
    name: "honeydew",
    hex: "#f0fff0",
    r: 240,
    g: 255,
    b: 240,
  },
  {
    name: "hotpink",
    hex: "#ff69b4",
    r: 255,
    g: 105,
    b: 180,
  },
  {
    name: "indianred",
    hex: "#cd5c5c",
    r: 205,
    g: 92,
    b: 92,
  },
  {
    name: "indigo",
    hex: "#4b0082",
    r: 75,
    g: 0,
    b: 130,
  },
  {
    name: "ivory",
    hex: "#fffff0",
    r: 255,
    g: 255,
    b: 240,
  },
  {
    name: "khaki",
    hex: "#f0e68c",
    r: 240,
    g: 230,
    b: 140,
  },
  {
    name: "lavender",
    hex: "#e6e6fa",
    r: 230,
    g: 230,
    b: 250,
  },
  {
    name: "lavenderblush",
    hex: "#fff0f5",
    r: 255,
    g: 240,
    b: 245,
  },
  {
    name: "lawngreen",
    hex: "#7cfc00",
    r: 124,
    g: 252,
    b: 0,
  },
  {
    name: "lemonchiffon",
    hex: "#fffacd",
    r: 255,
    g: 250,
    b: 205,
  },
  {
    name: "lightblue",
    hex: "#add8e6",
    r: 173,
    g: 216,
    b: 230,
  },
  {
    name: "lightcoral",
    hex: "#f08080",
    r: 240,
    g: 128,
    b: 128,
  },
  {
    name: "lightcyan",
    hex: "#e0ffff",
    r: 224,
    g: 255,
    b: 255,
  },
  {
    name: "lightgoldenrodyellow",
    hex: "#fafad2",
    r: 250,
    g: 250,
    b: 210,
  },
  {
    name: "lightgray",
    hex: "#d3d3d3",
    r: 211,
    g: 211,
    b: 211,
  },
  {
    name: "lightgreen",
    hex: "#90ee90",
    r: 144,
    g: 238,
    b: 144,
  },
  {
    name: "lightgrey",
    hex: "#d3d3d3",
    r: 211,
    g: 211,
    b: 211,
  },
  {
    name: "lightpink",
    hex: "#ffb6c1",
    r: 255,
    g: 182,
    b: 193,
  },
  {
    name: "lightsalmon",
    hex: "#ffa07a",
    r: 255,
    g: 160,
    b: 122,
  },
  {
    name: "lightseagreen",
    hex: "#20b2aa",
    r: 32,
    g: 178,
    b: 170,
  },
  {
    name: "lightskyblue",
    hex: "#87cefa",
    r: 135,
    g: 206,
    b: 250,
  },
  {
    name: "lightslategray",
    hex: "#778899",
    r: 119,
    g: 136,
    b: 153,
  },
  {
    name: "lightslategrey",
    hex: "#778899",
    r: 119,
    g: 136,
    b: 153,
  },
  {
    name: "lightsteelblue",
    hex: "#b0c4de",
    r: 176,
    g: 196,
    b: 222,
  },
  {
    name: "lightyellow",
    hex: "#ffffe0",
    r: 255,
    g: 255,
    b: 224,
  },
  {
    name: "lime",
    hex: "#00ff00",
    r: 0,
    g: 255,
    b: 0,
  },
  {
    name: "limegreen",
    hex: "#32cd32",
    r: 50,
    g: 205,
    b: 50,
  },
  {
    name: "linen",
    hex: "#faf0e6",
    r: 250,
    g: 240,
    b: 230,
  },
  {
    name: "magenta",
    hex: "#ff00ff",
    r: 255,
    g: 0,
    b: 255,
  },
  {
    name: "maroon",
    hex: "#800000",
    r: 128,
    g: 0,
    b: 0,
  },
  {
    name: "mediumaquamarine",
    hex: "#66cdaa",
    r: 102,
    g: 205,
    b: 170,
  },
  {
    name: "mediumblue",
    hex: "#0000cd",
    r: 0,
    g: 0,
    b: 205,
  },
  {
    name: "mediumorchid",
    hex: "#ba55d3",
    r: 186,
    g: 85,
    b: 211,
  },
  {
    name: "mediumpurple",
    hex: "#9370db",
    r: 147,
    g: 112,
    b: 219,
  },
  {
    name: "mediumseagreen",
    hex: "#3cb371",
    r: 60,
    g: 179,
    b: 113,
  },
  {
    name: "mediumslateblue",
    hex: "#7b68ee",
    r: 123,
    g: 104,
    b: 238,
  },
  {
    name: "mediumspringgreen",
    hex: "#00fa9a",
    r: 0,
    g: 250,
    b: 154,
  },
  {
    name: "mediumturquoise",
    hex: "#48d1cc",
    r: 72,
    g: 209,
    b: 204,
  },
  {
    name: "mediumvioletred",
    hex: "#c71585",
    r: 199,
    g: 21,
    b: 133,
  },
  {
    name: "midnightblue",
    hex: "#191970",
    r: 25,
    g: 25,
    b: 112,
  },
  {
    name: "mintcream",
    hex: "#f5fffa",
    r: 245,
    g: 255,
    b: 250,
  },
  {
    name: "mistyrose",
    hex: "#ffe4e1",
    r: 255,
    g: 228,
    b: 225,
  },
  {
    name: "moccasin",
    hex: "#ffe4b5",
    r: 255,
    g: 228,
    b: 181,
  },
  {
    name: "navajowhite",
    hex: "#ffdead",
    r: 255,
    g: 222,
    b: 173,
  },
  {
    name: "navy",
    hex: "#000080",
    r: 0,
    g: 0,
    b: 128,
  },
  {
    name: "oldlace",
    hex: "#fdf5e6",
    r: 253,
    g: 245,
    b: 230,
  },
  {
    name: "olive",
    hex: "#808000",
    r: 128,
    g: 128,
    b: 0,
  },
  {
    name: "olivedrab",
    hex: "#6b8e23",
    r: 107,
    g: 142,
    b: 35,
  },
  {
    name: "orange",
    hex: "#ffa500",
    r: 255,
    g: 165,
    b: 0,
  },
  {
    name: "orangered",
    hex: "#ff4500",
    r: 255,
    g: 69,
    b: 0,
  },
  {
    name: "orchid",
    hex: "#da70d6",
    r: 218,
    g: 112,
    b: 214,
  },
  {
    name: "palegoldenrod",
    hex: "#eee8aa",
    r: 238,
    g: 232,
    b: 170,
  },
  {
    name: "palegreen",
    hex: "#98fb98",
    r: 152,
    g: 251,
    b: 152,
  },
  {
    name: "paleturquoise",
    hex: "#afeeee",
    r: 175,
    g: 238,
    b: 238,
  },
  {
    name: "palevioletred",
    hex: "#db7093",
    r: 219,
    g: 112,
    b: 147,
  },
  {
    name: "papayawhip",
    hex: "#ffefd5",
    r: 255,
    g: 239,
    b: 213,
  },
  {
    name: "peachpuff",
    hex: "#ffdab9",
    r: 255,
    g: 218,
    b: 185,
  },
  {
    name: "peru",
    hex: "#cd853f",
    r: 205,
    g: 133,
    b: 63,
  },
  {
    name: "pink",
    hex: "#ffc0cb",
    r: 255,
    g: 192,
    b: 203,
  },
  {
    name: "plum",
    hex: "#dda0dd",
    r: 221,
    g: 160,
    b: 221,
  },
  {
    name: "powderblue",
    hex: "#b0e0e6",
    r: 176,
    g: 224,
    b: 230,
  },
  {
    name: "purple",
    hex: "#800080",
    r: 128,
    g: 0,
    b: 128,
  },
  {
    name: "rebeccapurple",
    hex: "#663399",
    r: 102,
    g: 51,
    b: 153,
  },
  {
    name: "red",
    hex: "#ff0000",
    r: 255,
    g: 0,
    b: 0,
  },
  {
    name: "rosybrown",
    hex: "#bc8f8f",
    r: 188,
    g: 143,
    b: 143,
  },
  {
    name: "royalblue",
    hex: "#4169e1",
    r: 65,
    g: 105,
    b: 225,
  },
  {
    name: "saddlebrown",
    hex: "#8b4513",
    r: 139,
    g: 69,
    b: 19,
  },
  {
    name: "salmon",
    hex: "#fa8072",
    r: 250,
    g: 128,
    b: 114,
  },
  {
    name: "sandybrown",
    hex: "#f4a460",
    r: 244,
    g: 164,
    b: 96,
  },
  {
    name: "seagreen",
    hex: "#2e8b57",
    r: 46,
    g: 139,
    b: 87,
  },
  {
    name: "seashell",
    hex: "#fff5ee",
    r: 255,
    g: 245,
    b: 238,
  },
  {
    name: "sienna",
    hex: "#a0522d",
    r: 160,
    g: 82,
    b: 45,
  },
  {
    name: "silver",
    hex: "#c0c0c0",
    r: 192,
    g: 192,
    b: 192,
  },
  {
    name: "skyblue",
    hex: "#87ceeb",
    r: 135,
    g: 206,
    b: 235,
  },
  {
    name: "slateblue",
    hex: "#6a5acd",
    r: 106,
    g: 90,
    b: 205,
  },
  {
    name: "slategray",
    hex: "#708090",
    r: 112,
    g: 128,
    b: 144,
  },
  {
    name: "slategrey",
    hex: "#708090",
    r: 112,
    g: 128,
    b: 144,
  },
  {
    name: "snow",
    hex: "#fffafa",
    r: 255,
    g: 250,
    b: 250,
  },
  {
    name: "springgreen",
    hex: "#00ff7f",
    r: 0,
    g: 255,
    b: 127,
  },
  {
    name: "steelblue",
    hex: "#4682b4",
    r: 70,
    g: 130,
    b: 180,
  },
  {
    name: "tan",
    hex: "#d2b48c",
    r: 210,
    g: 180,
    b: 140,
  },
  {
    name: "teal",
    hex: "#008080",
    r: 0,
    g: 128,
    b: 128,
  },
  {
    name: "thistle",
    hex: "#d8bfd8",
    r: 216,
    g: 191,
    b: 216,
  },
  {
    name: "tomato",
    hex: "#ff6347",
    r: 255,
    g: 99,
    b: 71,
  },
  {
    name: "turquoise",
    hex: "#40e0d0",
    r: 64,
    g: 224,
    b: 208,
  },
  {
    name: "violet",
    hex: "#ee82ee",
    r: 238,
    g: 130,
    b: 238,
  },
  {
    name: "wheat",
    hex: "#f5deb3",
    r: 245,
    g: 222,
    b: 179,
  },
  {
    name: "white",
    hex: "#ffffff",
    r: 255,
    g: 255,
    b: 255,
  },
  {
    name: "whitesmoke",
    hex: "#f5f5f5",
    r: 245,
    g: 245,
    b: 245,
  },
  {
    name: "yellow",
    hex: "#ffff00",
    r: 255,
    g: 255,
    b: 0,
  },
  {
    name: "yellowgreen",
    hex: "#9acd32",
    r: 154,
    g: 205,
    b: 50,
  },
];
