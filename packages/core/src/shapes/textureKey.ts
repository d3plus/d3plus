import {assign, isObject} from "@d3plus/dom";

/** textures.js path-based texture names, drawn by its `paths()` generator. */
const pathNames = [
  "squares",
  "nylon",
  "waves",
  "woven",
  "crosses",
  "caps",
  "hexagons",
];

/** Color-valued texture keys; a d3-color object is reduced to its CSS string. */
const colorKeys = ["background", "fill", "stroke"];

/**
    Builds the JSON key of a textures.js config for one datum, or `false` when
    the datum has no texture or no fill (`"none"`, e.g. a line or link). The key is what a `pattern:<key>` scene fill
    carries for the renderer backends to materialize. `fill` and `stroke` are
    the shape's resolved fill and stroke for the datum, used as the texture's
    default background and line colors.
    @private
*/
export function textureKey(
  textureVal: unknown,
  fill: () => unknown,
  stroke: () => unknown,
  textureDefault: Record<string, unknown> = {},
): string | false {
  if (!textureVal) return false;
  const background = fill();
  if (background === "none") return false;
  const texture: Record<string, unknown> = isObject(textureVal)
    ? {...(textureVal as Record<string, unknown>)}
    : {texture: textureVal};
  if (!texture.background) texture.background = background;
  if (!texture.stroke && !textureDefault.stroke) texture.stroke = stroke();
  if (
    pathNames.includes(texture.texture as string) ||
    typeof texture.texture === "function"
  ) {
    texture.d = texture.texture;
    texture.texture = "paths";
  } else if (texture.texture === "grid") {
    if (!texture.orientation && !textureDefault.orientation)
      texture.orientation = ["vertical", "horizontal"];
    texture.texture = "lines";
  }
  if (!texture.fill && texture.texture !== "paths")
    texture.fill = texture.stroke;
  for (const key of colorKeys) {
    const v = texture[key];
    if (v && typeof v === "object") texture[key] = String(v);
  }
  const retObj = assign({}, textureDefault, texture);
  if (typeof retObj.d === "function") {
    retObj.d = retObj.d(retObj.size || 20);
  }
  return JSON.stringify(retObj);
}
