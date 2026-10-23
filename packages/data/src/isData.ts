/** The keys a request object may hold: its `url` plus `fetch`'s request options. */
const requestKeys = new Set([
  "url",
  "body",
  "cache",
  "credentials",
  "headers",
  "integrity",
  "keepalive",
  "method",
  "mode",
  "priority",
  "redirect",
  "referrer",
  "referrerPolicy",
  "signal",
  "window",
]);

/**
  Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid data can either be a string URL or a request Object: a "url" plus any `fetch` request options (such as "headers" or "method"). An Object with any other key, like a data row that happens to have a "url" field, is not loaded.
  @param dataItem The value to be tested
*/
export default function (
  dataItem: string | Record<string, unknown> | unknown,
): boolean {
  if (typeof dataItem === "string") return true;
  if (typeof dataItem !== "object" || dataItem === null) return false;
  if (dataItem instanceof Array) return false;
  const item = dataItem as Record<string, unknown>;
  return (
    typeof item.url === "string" &&
    Object.keys(item).every(key => requestKeys.has(key))
  );
}
