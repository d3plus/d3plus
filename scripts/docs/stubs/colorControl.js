/**
    Decides when a generated Storybook argType gets a color picker.

    A setting is a color when its source types it as `CssColor` (the alias in
    `@d3plus/core`'s shape config, also accepted inside a chart field's
    `@type {…}` tag). Settings without that signal fall back to their name: a
    key like `fill`, `stroke`, `background`, `backgroundColor`, or one ending in
    `Color`/`Fill`/`Stroke`, but only when its value type is a plain string (or
    a string accessor), its description doesn't call it a data key, and any
    string default it has parses as a CSS color.
*/

const COLOR_TYPE = /^csscolor$/i;
const COLOR_KEY =
  /^(color|fill|stroke|background|backgroundColor)$|[a-z](Color|Fill|Stroke)$/;
const NON_VALUE_TYPE = /^(function|accessor|accessorfn|null|undefined)$/i;
const STRUCTURED_TYPE = /^(object|record|array)|^[{[]|\[\]$/i;
const KEY_DESCRIPTION = /\b(key|field|column)\b/i;
const CSS_COLOR =
  /^(#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|(rgb|hsl|hwb|lab|lch|oklab|oklch|color)a?\(.*\)|[a-z]+)$/i;

/** Whether a string reads as a CSS color: hex, a color function, or a keyword. */
export function isCssColor(value) {
  return typeof value === "string" && CSS_COLOR.test(value.trim());
}

/**
 * Whether a setting should get a color picker, given its key, the names of
 * its declared types (`["string", "Function"]`), its description, and its
 * runtime default.
 */
export function isColorArg({key, types = [], description = "", value}) {
  const names = types.map(t => String(t).trim());
  if (names.some(n => STRUCTURED_TYPE.test(n))) return false;
  if (names.some(n => COLOR_TYPE.test(n))) return true;

  if (!key || !COLOR_KEY.test(key)) return false;
  const values = names.filter(n => !NON_VALUE_TYPE.test(n));
  if (values.length !== 1 || values[0].toLowerCase() !== "string") return false;
  if (KEY_DESCRIPTION.test(description)) return false;
  if (typeof value === "string" && !isCssColor(value)) return false;
  return true;
}

/**
 * Switches an argType to a color picker when `isColorArg` says so. A default
 * that isn't a CSS color (an accessor's source, say) stays in the docs table
 * but is dropped as the picker's starting value.
 */
export function applyColorControl(arg, {key, types, description, value}) {
  if (!isColorArg({key, types, description, value})) return arg;
  arg.control = {type: "color"};
  if (arg.defaultValue !== undefined && !isCssColor(arg.defaultValue))
    delete arg.defaultValue;
  return arg;
}
