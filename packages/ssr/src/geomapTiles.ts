import type {GeomapTileOptions, RenderableViz} from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Node's Buffer, typed minimally so the package needs no @types/node.
const NodeBuffer = (globalThis as any).Buffer as {
  from(data: ArrayBuffer | Uint8Array): {toString(encoding: string): string};
};

/** Fetches one tile to a `data:` URI, or `null` if it fails/times out. */
async function fetchOne(
  url: string,
  opts: GeomapTileOptions,
): Promise<string | null> {
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
