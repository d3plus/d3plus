import type {GeomapTileOptions, RenderableViz} from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Node's Buffer, typed minimally so the package needs no @types/node.
const NodeBuffer = (globalThis as any).Buffer as {
  from(data: ArrayBuffer | Uint8Array): {toString(encoding: string): string};
};

/**
    Rejects tile URLs that are not plain `http`/`https` requests to a public
    host, blocking SSRF vectors such as cloud metadata endpoints
    (169.254.169.254), loopback, and other private/internal network ranges.
*/
function isSafeTileUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "metadata.google.internal" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^f[cd][0-9a-f]{0,2}:/.test(host) ||
    /^fe80:/.test(host)
  ) {
    return false;
  }
  return true;
}

/** Fetches one tile to a `data:` URI, or `null` if it fails/times out. */
async function fetchOne(
  url: string,
  opts: GeomapTileOptions,
): Promise<string | null> {
  if (!isSafeTileUrl(url)) return null;
  const timeout = opts.tileTimeout ?? 15000;
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : undefined;
  const timer = setTimeout(() => ctrl?.abort(), timeout);
  try {
    let bytes: ArrayBuffer | Uint8Array | null;
    let contentType = "image/png";
    if (opts.fetchTile) {
      bytes = await opts.fetchTile(url);
    } else {
      const res = await fetch(url, ctrl ? {signal: ctrl.signal} : undefined);
      if (!res.ok) return null;
      contentType = res.headers.get("content-type") || contentType;
      bytes = await res.arrayBuffer();
    }
    if (!bytes) return null;
    const b64 = NodeBuffer.from(bytes as ArrayBuffer).toString("base64");
    return `data:${contentType};base64,${b64}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolves an array of items through `worker` with a concurrency cap. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const runners = Array.from({length: Math.min(limit, items.length)}, async () => {
    for (let i = next++; i < items.length; i = next++) out[i] = await worker(items[i]);
  });
  await Promise.all(runners);
  return out;
}

/**
    If `viz` is a `Geomap` with tiles enabled, fetches its basemap tiles, inlines
    them as data URIs onto `viz._ssrTiles`, and re-renders via `rerender` so they
    land in the scene graph (SVG + canvas output then include the basemap). A
    no-op for non-map charts or when tiles are disabled (`.tiles(false)`).

    @param viz The chart being server-rendered.
    @param opts Tile fetching options.
    @param rerender Triggers a second render pass once tiles are inlined.
*/
export async function resolveGeomapTiles(
  viz: RenderableViz,
  opts: GeomapTileOptions,
  rerender: () => Promise<void>,
): Promise<void> {
  const compute = (viz as any)._computeTileList;
  if (typeof compute !== "function") return; // not a Geomap
  const list: Array<{key: string; url: string}> = compute.call(viz);
  if (!list || !list.length) return; // tiles disabled or none in view

  const uris = await mapLimit(list, opts.tileConcurrency ?? 8, t => fetchOne(t.url, opts));
  const map = new Map<string, string>();
  list.forEach((t, i) => {
    const uri = uris[i];
    if (uri) map.set(t.key, uri);
  });
  if (!map.size) return; // every tile failed — leave vector-only output

  (viz as any)._ssrTiles = map;
  await rerender();
}
