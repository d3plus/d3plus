/**
  The key a chart's data cache stores a load under: the loader key (`data`, `links`, `nodes`, `topojson`, `fitObject`) plus the JSON of every path in the request, so a request object's `fetch` options and each URL of a list are part of it. A single path and a one-item Array of it share a key.
  @param key The loader key.
  @param path The URL, request object, or Array of them (and of inline data) being loaded.
*/
export default function cacheKey(key: string, path: unknown): string {
  const paths = path instanceof Array ? path : [path];
  return `${key}_${JSON.stringify(paths)}`;
}
