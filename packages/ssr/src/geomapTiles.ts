import net from "node:net";
import dns from "node:dns";
import {Agent, fetch as undiciFetch} from "undici";
import type {GeomapTileOptions, RenderableViz} from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Node's Buffer, typed minimally so the package needs no @types/node.
const NodeBuffer = (globalThis as any).Buffer as {
  from(data: ArrayBuffer | Uint8Array): {toString(encoding: string): string};
};

// This-network, loopback, RFC1918 private, CGNAT/shared, link-local (covers
// the cloud metadata address 169.254.169.254), benchmarking, multicast, and
// reserved IPv4 ranges; loopback, unspecified, unique-local, and link-local
// IPv6 ranges. `BlockList` also matches these rules against IPv4-mapped IPv6
// addresses (`::ffff:a.b.c.d`) automatically, so that form needs no separate
// entry here.
const BLOCKED_RANGES = new net.BlockList();
for (const [addr, prefix] of [
  ["0.0.0.0", 8],
  ["127.0.0.0", 8],
  ["10.0.0.0", 8],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["169.254.0.0", 16],
  ["100.64.0.0", 10],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  BLOCKED_RANGES.addSubnet(addr, prefix, "ipv4");
}
for (const [addr, prefix] of [
  ["::1", 128],
  ["::", 128],
  ["fc00::", 7],
  ["fe80::", 10],
] as const) {
  BLOCKED_RANGES.addSubnet(addr, prefix, "ipv6");
}

/** Whether `address` (a literal IPv4/IPv6 address, not a hostname) is in a disallowed range. */
export function isBlockedAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 0) return true; // not a real address literal — reject defensively
  return BLOCKED_RANGES.check(address, family === 4 ? "ipv4" : "ipv6");
}

/**
    Rejects tile URLs that are not plain `http`/`https` requests, or whose
    host is already a literal address in a disallowed range. Hostnames are
    not IP literals, so they pass this check and are instead validated
    against the same ranges at DNS-resolution time (see `createTileLookup`),
    using the address they actually resolve to — checking a hostname string
    itself proves nothing, since it says nothing about what it resolves to.
*/
export function isSafeTileUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost") return false;
  if (net.isIP(host) && isBlockedAddress(host)) return false;
  return true;
}

/**
    Builds the `dns.lookup`-shaped resolver a tile fetch dispatcher uses to
    validate a hostname's resolved address before connecting. `resolve`
    defaults to `dns.lookup` and is overridable so tests can simulate
    arbitrary DNS results without touching the network. The address that gets
    validated is the exact address the connector then dials — there's no
    separate check-then-connect step for a DNS-rebinding attack to race.
*/
export function createTileLookup(resolve: typeof dns.lookup = dns.lookup) {
  return function lookup(
    hostname: string,
    options: dns.LookupOptions,
    callback: (err: Error | null, address: dns.LookupAddress[] | string, family?: number) => void,
  ): void {
    resolve(hostname, {...options, all: true}, (err, addresses) => {
      if (err) return callback(err, "");
      const list = Array.isArray(addresses) ? addresses : [{address: addresses as unknown as string, family: 0}];
      for (const {address} of list) {
        if (isBlockedAddress(address)) {
          return callback(
            new Error(
              `@d3plus/ssr: refusing to fetch a tile from "${hostname}", which resolves to the disallowed address ${address}.`,
            ),
            "",
          );
        }
      }
      if (options.all) return callback(null, list);
      const first = list[0];
      callback(null, first.address, first.family);
    });
  };
}

let tileDispatcher: Agent | undefined;

/** Lazily builds (and memoizes) the fetch dispatcher used for the built-in tile fetch path. */
function getTileDispatcher(): Agent {
  if (!tileDispatcher) tileDispatcher = new Agent({connect: {lookup: createTileLookup()}});
  return tileDispatcher;
}

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
      // Caller-owned network access — d3plus does not apply SSRF filtering here.
      bytes = await opts.fetchTile(url);
    } else {
      if (!isSafeTileUrl(url)) return null;
      const res = await undiciFetch(url, {
        signal: ctrl?.signal,
        redirect: "manual",
        dispatcher: getTileDispatcher(),
      });
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
