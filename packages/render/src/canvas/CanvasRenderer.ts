import {cubicInOut} from "../animate/interpolate.js";
import {interpolateScene} from "../animate/diff.js";
import {commitTrailScene, TrailLog} from "../animate/trailLog.js";
import type {LineNode, Scene, SceneNode, TextNode} from "../scene.js";
import {
  applyOverlayToElement,
  createOverlayHost,
  walkOverlays,
} from "../overlay.js";
import type {
  DrawOptions,
  PickResult,
  RenderHandle,
  Renderer,
  RenderTarget,
  SceneEvent,
} from "../Renderer.js";
import SvgRenderer from "../svg/SvgRenderer.js";
import {apply, invert, multiply, nodeMatrix} from "./transform.js";
import type {Mat} from "./transform.js";
import {paint, pathFor, solidFill} from "./canvasNodePaint.js";
import {patternTileSvg} from "./patternTile.js";

type Ctx = CanvasRenderingContext2D;

/** A pickable leaf, captured in paint order with its accumulated transform. */
interface PickEntry {
  node: SceneNode;
  /** Inverse of the node's accumulated absolute transform, for mapping points to local space. */
  inverse: Mat;
}

const raf: (cb: () => void) => void =
  typeof requestAnimationFrame === "function"
    ? cb => requestAnimationFrame(() => cb())
    : cb => {
        setTimeout(cb, 16);
      };

const now: () => number =
  typeof performance !== "undefined" && performance.now
    ? () => performance.now()
    : () => Date.now();

/**
    A Renderer backend that paints a Scene to a Canvas. It consumes the identical
    scene the SVG backend does; geometry/style are already resolved, so painting is
    a straight walk. Animation runs one requestAnimationFrame loop over interpolateScene.
*/
export default class CanvasRenderer implements Renderer {
  readonly kind = "canvas" as const;

  private _target?: RenderTarget;
  private _canvas?: HTMLCanvasElement;
  private _ctx?: Ctx;
  /** Sibling host for HtmlOverlayNode mounts (same approach as SvgRenderer). */
  private _overlayHost?: HTMLDivElement;
  /**
   * Cached key→element map for HtmlOverlay reconcile. Mutated as overlays
   * enter/exit so the hot path (every draw, including 60Hz zoom ticks)
   * doesn't pay for `host.querySelectorAll(':scope > .d3plus-render-overlay')`.
   */
  private _overlayMap: Map<string, HTMLDivElement> = new Map();
  private _ratio = 1;
  private _width = 0;
  private _height = 0;
  private _scene: Scene | null = null;
  /** Per-mark position history for persistent motion trails. */
  private _trailLog = new TrailLog();
  private _pickIndex: PickEntry[] = [];
  private _images = new Map<string, HTMLImageElement>();
  // Token → tiled CanvasPattern (rasterized from the texture's SVG tile), plus
  // the set of tokens whose rasterization is in flight. `_patternResolver` is a
  // pre-bound view passed into the paint path so no closure is allocated per
  // node per frame.
  private _patterns = new Map<string, CanvasPattern>();
  private _patternsPending = new Set<string>();
  private _patternResolver = (token: string): CanvasPattern | null =>
    this._resolvePattern(token);
  private _handlers = new Set<(event: SceneEvent) => void>();
  private _domListeners: Record<string, (e: Event) => void> = {};
  private _listening = false;
  private _hoverKey: string | number | null = null;
  private _frame = 0;
  /**
   * `_cancelAnim(soft?)` — call with `soft=true` to stop the tick loop
   * without snap-painting the target scene; `false`/omitted snaps + paints
   * (so external `handle.cancel()` matches what resize/toSVGString see).
   */
  private _cancelAnim: ((soft?: boolean) => void) | null = null;
  private _invalidatePointerRect: (() => void) | null = null;
  private _removePointerRectListeners: (() => void) | null = null;

  mount(target: RenderTarget): void {
    this._target = target;
    this._ratio = target.pixelRatio ?? (typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1);
    const canvas = document.createElement("canvas");
    canvas.className = "d3plus-render-canvas";
    canvas.style.display = "block";
    // `createOverlayHost` handles `position: relative` on container.
    this._overlayHost = createOverlayHost(target);
    target.container.insertBefore(canvas, this._overlayHost);
    this._canvas = canvas;
    this._ctx = canvas.getContext("2d") as Ctx;
    this.resize(target.width, target.height);
  }

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    if (!this._canvas) return;
    this._canvas.width = Math.round(width * this._ratio);
    this._canvas.height = Math.round(height * this._ratio);
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;
    if (this._invalidatePointerRect) this._invalidatePointerRect();
    if (this._scene) this._paint(this._scene);
  }

  /**
      Public view onto the mount target. See SvgRenderer.target — same
      contract: host code uses this to detect container changes without
      reaching into the private `_target` slot.
  */
  target(): RenderTarget | undefined {
    return this._target;
  }

  drawScene(scene: Scene, opts?: DrawOptions): RenderHandle {
    if (!this._ctx) throw new Error("CanvasRenderer.drawScene called before mount()");
    // Cancel any in-flight animation with the "soft" path — don't
    // snap-paint the previous target. The new animation that's about
    // to start will pick up from the visible canvas pixels and
    // smoothly transition to `scene`. Only handle.cancel() invocations
    // by external callers want the snap-to-target behavior.
    if (this._cancelAnim) this._cancelAnim(true);

    const duration = opts?.duration ?? 0;
    const prev = this._scene;
    // Fold this draw into each persistent-trail mark's history (once per draw,
    // not per frame), so committed segments accumulate and stale keys are pruned.
    // The log is threaded into the interp only when a persistent trail exists, so
    // the common (no-persist) path keeps its fast direct paint / trail-free diff.
    const trailLog = commitTrailScene(this._trailLog, scene, opts?.sequence) ? this._trailLog : undefined;

    if (!duration) {
      // With persistent trails, paint the resting frame (t=1) through the interp
      // so they stay drawn on non-animated repaints (e.g. hover); otherwise paint
      // the raw scene directly. Either way store the raw scene as `prev`.
      this._paint(trailLog ? interpolateScene(prev, scene, trailLog)(1) : scene);
      this._scene = scene;
      this._reconcileOverlays(scene);
      opts?.onEnd?.();
      return {finished: Promise.resolve(), cancel: () => {}};
    }
    // For animated scenes the canvas paints per-frame; HTML overlays
    // don't animate, just snap to their target positions.
    this._reconcileOverlays(scene);

    const ease = opts?.ease ?? cubicInOut;
    const interp = interpolateScene(prev, scene, trailLog);
    const start = now();
    let cancelled = false;

    const finished = new Promise<void>(resolve => {
      const tick = (): void => {
        if (cancelled) return resolve();
        const elapsed = now() - start;
        const t = Math.min(1, elapsed / duration);
        const frame = interp(ease(t));
        this._paint(frame);
        opts?.onFrame?.(t);
        if (t < 1) {
          this._frame = raf(tick) as unknown as number;
        } else {
          this._scene = scene;
          // Paint the final interp frame (not the raw scene) so persistent
          // trails remain drawn at rest; `frame` here is interp at t === 1.
          this._paint(frame);
          this._cancelAnim = null;
          opts?.onEnd?.();
          resolve();
        }
      };
      // `soft` distinguishes the two cancel paths:
      //   - external `handle.cancel()` → snap to target + paint so a
      //     subsequent resize/toSVGString matches the visible canvas
      //   - internal auto-cancel from drawScene → just stop ticking;
      //     the new animation handles the visible transition.
      this._cancelAnim = (soft = false): void => {
        cancelled = true;
        if (!soft) {
          this._scene = scene;
          this._paint(scene);
        }
        this._cancelAnim = null;
      };
      this._frame = raf(tick) as unknown as number;
    });

    return {
      finished,
      cancel: () => {
        if (this._cancelAnim) this._cancelAnim();
      },
    };
  }

  private _paint(scene: Scene): void {
    const ctx = this._ctx!;
    this._pickIndex = [];
    ctx.save();
    ctx.setTransform(this._ratio, 0, 0, this._ratio, 0, 0);
    ctx.clearRect(0, 0, this._width, this._height);
    if (scene.meta?.background) {
      ctx.fillStyle = scene.meta.background;
      ctx.fillRect(0, 0, this._width, this._height);
    }
    this._drawChildren(ctx, scene.root.children, 1, [this._ratio, 0, 0, this._ratio, 0, 0]);
    ctx.restore();
  }

  /** Draws a node list in z-order, accumulating alpha and the transform matrix for picking. */
  private _drawChildren(ctx: Ctx, children: SceneNode[], alpha: number, abs: Mat): void {
    // Skip sort allocation + comparator runs when no child has z set.
    // The common case (every node lacks z; paint in source order).
    let needsSort = false;
    for (let i = 0; i < children.length; i++) {
      if (children[i].z !== undefined) {
        needsSort = true;
        break;
      }
    }
    const ordered = needsSort
      ? [...children].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
      : children;
    for (const node of ordered) this._drawNode(ctx, node, alpha, abs);
  }

  private _drawNode(ctx: Ctx, node: SceneNode, alpha: number, parentAbs: Mat): void {
    const localAbs = multiply(parentAbs, nodeMatrix(node.transform));
    const a = alpha * (node.paint?.opacity ?? 1);

    ctx.save();
    ctx.setTransform(localAbs[0], localAbs[1], localAbs[2], localAbs[3], localAbs[4], localAbs[5]);

    if (node.interactive !== false && node.type !== "group")
      this._pickIndex.push({node, inverse: invert(localAbs)});

    switch (node.type) {
      case "rect":
      case "circle":
      case "line":
      case "area":
        pathFor(ctx, node);
        paint(ctx, node, a, undefined, this._patternResolver);
        break;
      case "path":
        paint(ctx, node, a, new Path2D(node.d), this._patternResolver);
        break;
      case "image":
        this._drawImage(ctx, node, a);
        break;
      case "text":
        this._drawText(ctx, node, a);
        break;
      case "group": {
        if (node.clip) {
          if (node.clip.type === "rect") {
            ctx.beginPath();
            ctx.rect(node.clip.x, node.clip.y, node.clip.width, node.clip.height);
            ctx.clip();
          } else {
            ctx.clip(new Path2D(node.clip.d));
          }
        }
        this._drawChildren(ctx, node.children, a, localAbs);
        break;
      }
      case "htmlOverlay":
        // HTML overlays live in the sibling overlay-host div; no canvas paint.
        break;
    }
    ctx.restore();
  }

  /**
      Reconciles HtmlOverlay scene nodes into the overlay-host div. Mirrors
      `SvgRenderer._reconcileOverlays`; walks the scene tree accumulating
      overlays + their inherited transform offsets, then keys by `node.key`
      for enter/update/exit.
  */
  private _reconcileOverlays(scene: Scene): void {
    if (!this._overlayHost) return;
    const collected = walkOverlays(scene);
    const host = this._overlayHost;
    // Keyed reconcile against the cached map — no per-draw querySelectorAll.
    const existing = this._overlayMap;
    const seen = new Set<string>();
    for (const item of collected) {
      const key = String(item.node.key);
      seen.add(key);
      let el = existing.get(key);
      const justCreated = !el;
      if (!el) {
        el = document.createElement("div");
        el.className = "d3plus-render-overlay";
        el.setAttribute("data-key", key);
        el.style.position = "absolute";
        el.style.pointerEvents = "auto";
        host.appendChild(el);
        existing.set(key, el);
      }
      applyOverlayToElement(el, item);
      // `onMount` runs once per host (entry); `onUpdate` every draw.
      const o = item.node;
      if (justCreated && o.onMount) o.onMount(el);
      if (o.onUpdate) o.onUpdate(el);
    }
    for (const [key, el] of existing) {
      if (!seen.has(key)) {
        el.remove();
        existing.delete(key);
      }
    }
  }

  private _drawText(ctx: Ctx, node: TextNode, alpha: number): void {
    const f = node.font || {};
    const baseStyle = f.style ?? "normal";
    const baseWeight = f.weight ?? "normal";
    const size = f.size ?? 12;
    const family = f.family ?? "sans-serif";
    ctx.font = `${baseStyle} ${baseWeight} ${size}px ${family}`;
    ctx.textAlign = f.anchor === "middle" ? "center" : f.anchor === "end" ? "right" : "left";
    ctx.textBaseline = f.baseline === "middle" ? "middle" : f.baseline === "hanging" ? "hanging" : "alphabetic";
    const p = node.paint || {};
    ctx.globalAlpha = alpha * (p.fillOpacity ?? 1);
    ctx.fillStyle = solidFill(p.fill) ?? "#000";
    for (const ln of node.lines) {
      if (ln.runs && ln.runs.length) {
        // Paint runs left-to-right with per-run weight/style. textAlign is
        // forced to "left" within the line — the line's own x already encodes
        // anchor placement at layout time.
        const prevAlign: CanvasTextAlign = ctx.textAlign;
        ctx.textAlign = "left";
        let cursor = ln.x;
        for (const run of ln.runs) {
          const w = run.style?.weight ?? baseWeight;
          const s = run.style?.style ?? baseStyle;
          ctx.font = `${s} ${w} ${size}px ${family}`;
          ctx.fillText(run.text, cursor, ln.y);
          cursor += ctx.measureText(run.text).width;
        }
        ctx.font = `${baseStyle} ${baseWeight} ${size}px ${family}`;
        ctx.textAlign = prevAlign;
      } else {
        ctx.fillText(ln.text, ln.x, ln.y);
      }
    }
  }

  /**
      Resolves a `pattern:<json>` texture token to a tiled CanvasPattern.

      textures.js emits SVG `<pattern>`s a 2D context can't consume, so the tile
      is rasterized: its standalone SVG markup ({@link patternTileSvg}) is loaded
      as an Image onto an offscreen canvas, then `createPattern(…, "repeat")`
      tiles it. Loading is async, so the first paint returns null (the caller
      paints the texture's solid fallback) and we repaint once the tile is ready
      — the same warm-up-then-repaint model as {@link _drawImage}.
  */
  private _resolvePattern(token: string): CanvasPattern | null {
    const cached = this._patterns.get(token);
    if (cached) return cached;
    if (this._patternsPending.has(token)) return null;

    const tile = patternTileSvg(token);
    if (!tile) return null;

    this._patternsPending.add(token);
    const img = new Image();
    img.onload = () => {
      try {
        const off = document.createElement("canvas");
        off.width = tile.width;
        off.height = tile.height;
        const octx = off.getContext("2d");
        const pat =
          octx &&
          (octx.drawImage(img, 0, 0, tile.width, tile.height),
          this._ctx?.createPattern(off, "repeat"));
        if (pat) this._patterns.set(token, pat);
      } finally {
        this._patternsPending.delete(token);
        if (this._scene) this._paint(this._scene);
      }
    };
    img.onerror = () => {
      this._patternsPending.delete(token);
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tile.svg)}`;
    return null;
  }

  private _drawImage(ctx: Ctx, node: Extract<SceneNode, {type: "image"}>, alpha: number): void {
    let img = this._images.get(node.href);
    if (!img) {
      img = new Image();
      img.onload = () => {
        if (this._scene) this._paint(this._scene);
      };
      img.src = node.href;
      this._images.set(node.href, img);
    }
    if (img.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, node.x, node.y, node.width, node.height);
    }
  }

  pick(point: [number, number]): PickResult | null {
    // Topmost wins: entries are in paint order, so search from the end.
    for (let i = this._pickIndex.length - 1; i >= 0; i--) {
      const {node, inverse} = this._pickIndex[i];
      const [lx, ly] = apply(inverse, [point[0] * this._ratio, point[1] * this._ratio]);
      if (this._hitTest(node, lx, ly))
        return {node, datum: node.datum, index: node.index};
    }
    return null;
  }

  private _hitTest(node: SceneNode, lx: number, ly: number): boolean {
    switch (node.type) {
      case "rect":
        return lx >= node.x && lx <= node.x + node.width && ly >= node.y && ly <= node.y + node.height;
      case "circle":
        return (lx - node.cx) ** 2 + (ly - node.cy) ** 2 <= node.r ** 2;
      case "path":
        return this._ctx ? this._ctx.isPointInPath(new Path2D(node.d), lx, ly) : false;
      case "area":
        if (!this._ctx) return false;
        pathFor(this._ctx, node);
        return this._ctx.isPointInPath(lx, ly);
      case "line":
        return this._hitLine(node, lx, ly);
      case "image":
        return lx >= node.x && lx <= node.x + node.width && ly >= node.y && ly <= node.y + node.height;
      case "text":
        return this._hitText(node, lx, ly);
      default:
        return false;
    }
  }

  /** Hits a polyline when the point is within (strokeWidth/2 + 2px) of any segment. */
  private _hitLine(node: LineNode, lx: number, ly: number): boolean {
    const tol = (node.paint?.strokeWidth ?? 1) / 2 + 2;
    const pts = node.points;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1];
      const [x2, y2] = pts[i];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, ((lx - x1) * dx + (ly - y1) * dy) / len2)) : 0;
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      if ((lx - px) ** 2 + (ly - py) ** 2 <= tol * tol) return true;
    }
    return false;
  }

  /** Loose bounding-box hit test over a text node's laid-out lines. */
  private _hitText(node: TextNode, lx: number, ly: number): boolean {
    const size = node.font?.size ?? 12;
    const anchor = node.font?.anchor;
    for (const ln of node.lines) {
      const left = anchor === "middle" ? ln.x - ln.width / 2 : anchor === "end" ? ln.x - ln.width : ln.x;
      if (lx >= left && lx <= left + ln.width && ly >= ln.y - size && ly <= ln.y + size * 0.3) return true;
    }
    return false;
  }

  on(handler: (event: SceneEvent) => void): () => void {
    this._handlers.add(handler);
    if (!this._listening) this._attachListeners();
    return () => {
      this._handlers.delete(handler);
    };
  }

  private _attachListeners(): void {
    if (!this._canvas) return;
    this._listening = true;
    const canvas = this._canvas;
    // Cache the canvas bounding rect to avoid forced layout reflow on
    // every pointer event (mousemove fires 60-120×/sec during a drag).
    // Invalidated by resize observer + scroll. Recompute lazily if the
    // cache is missing or zero-sized (initial mount, post-detach).
    let cachedRect: DOMRect | null = null;
    const invalidateRect = () => {
      cachedRect = null;
    };
    const onResize = invalidateRect;
    const onScroll = invalidateRect;
    window.addEventListener("resize", onResize, {passive: true});
    window.addEventListener("scroll", onScroll, {passive: true, capture: true});
    this._invalidatePointerRect = invalidateRect;
    this._removePointerRectListeners = () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, {capture: true} as EventListenerOptions);
    };
    const local = (e: MouseEvent): [number, number] => {
      if (!cachedRect || (cachedRect.width === 0 && cachedRect.height === 0)) {
        cachedRect = canvas.getBoundingClientRect();
      }
      return [e.clientX - cachedRect.left, e.clientY - cachedRect.top];
    };
    const emit = (type: string, e: MouseEvent): void => {
      const point = local(e);
      const pick = this.pick(point);
      if (type === "mousemove") {
        const key = pick?.node.key ?? null;
        if (key !== this._hoverKey) {
          if (this._hoverKey !== null)
            this._dispatch({type: "mouseleave", point, pick: null, nativeEvent: e});
          this._hoverKey = key;
          if (key !== null) this._dispatch({type: "mouseenter", point, pick, nativeEvent: e});
        }
      }
      this._dispatch({type, point, pick, nativeEvent: e});
    };
    this._domListeners = {
      click: e => emit("click", e as MouseEvent),
      dblclick: e => emit("dblclick", e as MouseEvent),
      contextmenu: e => emit("contextmenu", e as MouseEvent),
      mousemove: e => emit("mousemove", e as MouseEvent),
      mouseleave: e => {
        if (this._hoverKey !== null) {
          this._dispatch({type: "mouseleave", point: local(e as MouseEvent), pick: null, nativeEvent: e});
          this._hoverKey = null;
        }
      },
    };
    for (const [k, fn] of Object.entries(this._domListeners)) canvas.addEventListener(k, fn);
  }

  private _dispatch(event: SceneEvent): void {
    for (const h of this._handlers) h(event);
  }

  /** Re-renders the retained scene through the SVG backend to produce an SVG string. */
  toSVGString(): string {
    if (!this._scene || typeof document === "undefined") return "";
    const holder = document.createElement("div");
    const svg = new SvgRenderer();
    svg.mount({container: holder, width: this._width, height: this._height});
    svg.drawScene(this._scene);
    const out = svg.toSVGString();
    svg.destroy();
    return out;
  }

  toCanvas(): HTMLCanvasElement {
    return this._canvas as HTMLCanvasElement;
  }

  destroy(): void {
    if (this._cancelAnim) this._cancelAnim();
    if (this._canvas) {
      for (const [k, fn] of Object.entries(this._domListeners))
        this._canvas.removeEventListener(k, fn);
      this._canvas.remove();
    }
    if (this._overlayHost) {
      this._overlayHost.remove();
      this._overlayHost = undefined;
    }
    this._overlayMap.clear();
    if (this._removePointerRectListeners) {
      this._removePointerRectListeners();
      this._removePointerRectListeners = null;
      this._invalidatePointerRect = null;
    }
    this._handlers.clear();
    this._domListeners = {};
    this._listening = false;
    this._images.clear();
    // CanvasPatterns are bound to the context being torn down.
    this._patterns.clear();
    this._patternsPending.clear();
    this._canvas = undefined;
    this._ctx = undefined;
    this._scene = null;
    this._pickIndex = [];
    this._target = undefined;
  }
}
