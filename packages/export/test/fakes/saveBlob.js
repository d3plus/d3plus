/** Every `saveBlob(blob, name)` call, in order. */
export const saved = [];

export default function saveBlob(blob, name) {
  saved.push({blob, name});
}
