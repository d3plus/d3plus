import {getCanvasBackend} from "./backend.js";
import {patternTileSvg} from "./patternTile.js";

type Ctx = CanvasRenderingContext2D;

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
    Base64-encodes a string's UTF-8 bytes. The tile is passed as a base64
    `data:` URI because native decoders (`@napi-rs/canvas`) read a non-base64
    payload as raw bytes without percent-decoding it. Self-contained rather than
    `btoa`, which headless DOM shims can replace on the global scope.
*/
function base64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (bytes[i] << 16) | (b1 << 8) | b2;
    out += BASE64[(n >> 18) & 63] + BASE64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? BASE64[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? BASE64[n & 63] : "=";
  }
  return out;
}

/**
    @class CanvasResources
    Owns the Canvas backend's async resources — decoded `<image>` bitmaps and
    tiled texture `CanvasPattern`s — plus the machinery to wait for them.

    Both decode asynchronously: the first paint that needs a resource kicks off
    its load and paints a fallback (nothing for images, the texture's solid color
    for patterns); a repaint follows once the resource is ready. A resource that
    fails to decode is remembered and never re-requested, so its fallback stays
    and repaints don't restart the load. That live
    warm-up-then-repaint model is invisible in the browser. A server render, which
    reads pixels once and stops, instead awaits {@link whenSettled} so every
    resource is present before encoding.
*/
export class CanvasResources {
  /** href → decoded image (present only once fully loaded). */
  readonly images = new Map<string, HTMLImageElement>();
  /** token → tiled pattern (present only once rasterized). */
  readonly patterns = new Map<string, CanvasPattern>();
  private readonly imagesPending = new Set<string>();
  private readonly patternsPending = new Set<string>();
  /** hrefs / tokens whose decode failed; they keep their fallback. */
  private readonly imagesFailed = new Set<string>();
  private readonly patternsFailed = new Set<string>();
  private readonly pending = new Set<Promise<unknown>>();

  /**
      @param ctx Accessor for the live 2D context (needed to build patterns).
      @param repaint Repaints the retained scene after a resource resolves.
  */
  constructor(
    private readonly ctx: () => Ctx | undefined,
    private readonly repaint: () => void,
  ) {}

  /** Tracks an in-flight decode so {@link whenSettled} can await it. */
  private track(p: Promise<unknown>): void {
    this.pending.add(p);
    const done = (): void => {
      this.pending.delete(p);
    };
    p.then(done, done);
  }

  /**
      Resolves once every in-flight decode has settled and a final frame has
      repainted. A resolution repaints, which can enqueue further decodes, so
      this drains until the queue empties (guarded against pathological loops).
  */
  async whenSettled(): Promise<void> {
    let guard = 0;
    while (this.pending.size && guard++ < 1000)
      await Promise.allSettled([...this.pending]);
    this.repaint();
  }

  /**
      Returns the decoded image for `href`, or `null` if it isn't ready yet
      (kicking off the load on first request). Callers draw only when non-null.
  */
  imageFor(href: string): HTMLImageElement | null {
    const img = this.images.get(href);
    if (img) return img;
    if (!this.imagesPending.has(href) && !this.imagesFailed.has(href)) {
      this.imagesPending.add(href);
      this.track(
        getCanvasBackend()
          .loadImage(href)
          .then(
            loaded => {
              this.images.set(href, loaded);
            },
            () => {
              this.imagesFailed.add(href);
            },
          )
          .finally(() => {
            this.imagesPending.delete(href);
            this.repaint();
          }),
      );
    }
    return null;
  }

  /**
      Resolves a `pattern:<json>` texture token to a tiled `CanvasPattern`, or
      `null` until it rasterizes. textures.js emits SVG a 2D context can't
      consume, so the tile's standalone SVG ({@link patternTileSvg}) is decoded
      onto an offscreen canvas and tiled with `createPattern(…, "repeat")`.
  */
  resolvePattern(token: string): CanvasPattern | null {
    const cached = this.patterns.get(token);
    if (cached) return cached;
    if (this.patternsPending.has(token) || this.patternsFailed.has(token))
      return null;

    const tile = patternTileSvg(token);
    if (!tile) return null;

    const backend = getCanvasBackend();
    this.patternsPending.add(token);
    const src = `data:image/svg+xml;base64,${base64Utf8(tile.svg)}`;
    this.track(
      backend
        .loadImage(src)
        .then(
          img => {
            const off = backend.createCanvas(tile.width, tile.height);
            off.width = tile.width;
            off.height = tile.height;
            const octx = off.getContext("2d");
            if (octx) {
              octx.drawImage(img, 0, 0, tile.width, tile.height);
              const pat = this.ctx()?.createPattern(off, "repeat");
              if (pat) this.patterns.set(token, pat);
            }
          },
          () => {
            this.patternsFailed.add(token);
          },
        )
        .finally(() => {
          this.patternsPending.delete(token);
          this.repaint();
        }),
    );
    return null;
  }

  /** Drops all cached + pending resources (CanvasPatterns are context-bound). */
  clear(): void {
    this.images.clear();
    this.imagesPending.clear();
    this.imagesFailed.clear();
    this.patterns.clear();
    this.patternsPending.clear();
    this.patternsFailed.clear();
    this.pending.clear();
  }
}
