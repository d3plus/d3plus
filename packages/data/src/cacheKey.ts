/**
  The key the data cache stores a fetched response under: the JSON of the URL or request object, so a request object's `fetch` options are part of it. Every loader (`data`, `links`, `nodes`, `topojson`, `fitObject`) shares these keys, so two loaders naming the same request share one response.
  @param request The URL or request object being fetched.
*/
export default function cacheKey(request: unknown): string {
  return JSON.stringify(request);
}
