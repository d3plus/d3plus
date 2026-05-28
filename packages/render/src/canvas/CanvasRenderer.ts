import {area as d3area, line as d3line} from "d3-shape";

import {cubicInOut} from "../animate/interpolate.js";
import {interpolateScene} from "../animate/diff.js";
import {curveFor} from "../paths.js";
import type {AreaNode, LineNode, Scene, SceneNode, TextNode} from "../scene.js";
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

/** Issues the current-path commands for a node's geometry into the context. */
function pathFor(ctx: Ctx, node: SceneNode): void {
  switch (node.type) {
    case "rect":
      ctx.beginPath();
      ctx.rect(node.x, node.y, node.width, node.height);
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, node.r, 0, 2 * Math.PI);
      break;
    case "line": {
      const n = node as LineNode;
      const gen = d3line<[number, number]>()
        .curve(curveFor(n.curve))
        .x(p => p[0])
        .y(p => p[1])
        .context(ctx);
      ctx.beginPath();
      gen(n.points);
      break;
    }
    case "area": {
      const n = node as AreaNode;
      const gen = d3area<number>()
        .curve(curveFor(n.curve))
        .x((_, i) => n.topline[i][0])
        .y0((_, i) => (n.baseline[i] ? n.baseline[i][1] : 0))
        .y1((_, i) => n.topline[i][1])
        .context(ctx);
      ctx.beginPath();
      gen(n.topline.map((_, i) => i));
      break;
    }
  }
}

/**
    Degrades a fill to a solid color the Canvas backend can paint. Texture fills
    ("pattern:<json>") fall back to the texture's background/fill color, since
    textures.js generates SVG patterns the canvas cannot consume.
*/
function solidFill(fill?: string): string | undefined {
  if (!fill || !fill.startsWith("pattern:")) return fill;
  try {
    const cfg = JSON.parse(fill.slice("pattern:".length));
    return cfg.background || cfg.fill || cfg.stroke || "#ccc";
  } catch {
    return "#ccc";
  }
}

/** Fills and/or strokes the context's current path (or a Path2D) per the node's paint. */
function paint(ctx: Ctx, node: SceneNode, alpha: number, path?: Path2D): void {
  const p = node.paint || {};
  const fill = solidFill(p.fill);
  if (fill && fill !== "none") {
    ctx.globalAlpha = alpha * (p.fillOpacity ?? 1);
    ctx.fillStyle = fill;
    if (path) ctx.fill(path);
    else ctx.fill();
  }
  if (p.stroke && p.stroke !== "none" && (p.strokeWidth ?? 0) > 0) {
    ctx.globalAlpha = alpha * (p.strokeOpacity ?? 1);
    ctx.strokeStyle = p.stroke;
    ctx.lineWidth = p.strokeWidth as number;
    ctx.setLineDash(p.strokeDasharray ?? []);
    if (p.strokeLinecap) ctx.lineCap = p.strokeLinecap;
    if (path) ctx.stroke(path);
    else ctx.stroke();
  }
}

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
  private _ratio = 1;
  private _width = 0;
  private _height = 0;
  private _scene: Scene | null = null;
  private _pickIndex: PickEntry[] = [];
  private _images = new Map<string, HTMLImageElement>();
  private _handlers = new Set<(event: SceneEvent) => void>();
  private _domListeners: Record<string, (e: Event) => void> = {};
  private _listening = false;
  private _hoverKey: string | number | null = null;
  private _frame = 0;
  private _cancelAnim: (() => void) | null = null;

  mount(target: RenderTarget): void {
    this._target = target;
    this._ratio = target.pixelRatio ?? (typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1);
    const canvas = document.createElement("canvas");
    canvas.className = "d3plus-render-canvas";
    canvas.style.display = "block";
    target.container.appendChild(canvas);
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
    if (this._scene) this._paint(this._scene);
  }

  drawScene(scene: Scene, opts?: DrawOptions): RenderHandle {
    if (!this._ctx) throw new Error("CanvasRenderer.drawScene called before mount()");
    if (this._cancelAnim) this._cancelAnim();

    const duration = opts?.duration ?? 0;
    const prev = this._scene;

    if (!duration) {
      this._paint(scene);
      this._scene = scene;
      opts?.onEnd?.();
      return {finished: Promise.resolve(), cancel: () => {}};
    }

    const ease = opts?.ease ?? cubicInOut;
    const interp = interpolateScene(prev, scene);
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
          this._paint(scene);
          this._cancelAnim = null;
          opts?.onEnd?.();
          resolve();
        }
      };
      this._cancelAnim = () => {
        cancelled = true;
        this._scene = scene;
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
    const ordered = [...children].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
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
        paint(ctx, node, a);
        break;
      case "path":
        paint(ctx, node, a, new Path2D(node.d));
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
    }
    ctx.restore();
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
        const prevAlign = ctx.textAlign;
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
    const local = (e: MouseEvent): [number, number] => {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
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
    this._handlers.clear();
    this._domListeners = {};
    this._listening = false;
    this._images.clear();
    this._canvas = undefined;
    this._ctx = undefined;
    this._scene = null;
    this._pickIndex = [];
    this._target = undefined;
  }
}
