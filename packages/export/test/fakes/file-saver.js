/** Every `saveAs(blob, name)` call, in order. */
export const saved = [];

export function saveAs(blob, name) {
  saved.push({blob, name});
}
