/* eslint-disable @typescript-eslint/no-explicit-any */
import {select} from "d3-selection";
import {interpolatePath} from "d3-interpolate-path";
import {transition} from "d3-transition";
import textures from "textures";

import {collapse} from "../animate/interpolate.js";
import {areaPath, linePath} from "../paths.js";
import type {GroupNode, Scene, SceneNode, TextNode} from "../scene.js";
import type {
  DrawOptions,
  PickResult,
  RenderHandle,
  Renderer,
  RenderTarget,
  SceneEvent,
} from "../Renderer.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

/** Maps a scene node to the SVG element tag that realizes it. */
function tagFor(node: SceneNode): string {
  switch (node.type) {
    case "rect": return "rect";
    case "circle": return "circle";
    case "line":
    case "area":
    case "path": return "path";
    case "image": return "image";
    case "text": return "text";
    case "group": return "g";
  }
}

/** Builds the SVG transform string for a node, or null when it has no transform. */
function transformStr(node: SceneNode): string | null {
  const tr = node.transform;
  if (!tr) return null;
  const parts: string[] = [];
  if (tr.x !== undefined || tr.y !== undefined)
    parts.push(`translate(${tr.x ?? 0},${tr.y ?? 0})`);
  if (tr.scale !== undefined && tr.scale !== 1) parts.push(`scale(${tr.scale})`);
  if (tr.rotate)
    parts.push(
      tr.rotateAnchor
        ? `rotate(${tr.rotate},${tr.rotateAnchor[0]},${tr.rotateAnchor[1]})`
        : `rotate(${tr.rotate})`,
    );
  return parts.join(" ") || null;
}

/** Recursively records every node by its (stringified) key for hit-testing. */
function buildIndex(node: SceneNode, index: Map<string, SceneNode>): void {
  index.set(String(node.key), node);
  if (node.type === "group") for (const c of node.children) buildIndex(c, index);
}

/** Applies non-animated attributes: classes, accessibility, pointer behavior, content. */
function applyStatic(sel: any, node: SceneNode): void {
  sel
    .attr("class", `d3plus-render-node d3plus-render-${node.type}`)
    .attr("data-key", String(node.key))
    .attr("id", node.id ?? null)
    .attr("role", node.aria?.role ?? null)
    .attr("aria-label", node.aria?.label ?? null)
    .attr("aria-hidden", node.aria?.hidden ? "true" : null)
    .attr("pointer-events", node.interactive === false ? "none" : null);

  if (node.type === "image") {
    sel.attr("href", node.href);
    sel.attr("xlink:href", node.href).attr("xmlns:xlink", XLINK_NS);
  }
  if (node.type === "text") applyText(sel, node);
}

/** Rebuilds the tspans and font attributes of a text node (content is not animated). */
function applyText(sel: any, node: TextNode): void {
  const f = node.font || {};
  sel
    .attr("font-family", f.family ?? null)
    .attr("font-size", f.size ?? null)
    .attr("font-weight", f.weight ?? null)
    .attr("font-style", f.style ?? null)
    .attr("text-anchor", f.anchor ?? null)
    .attr("dominant-baseline", f.baseline ?? null)
    .attr("dir", f.dir ?? null);
  sel.selectAll("tspan").remove();
  sel.text(null);

  for (const ln of node.lines) {
    const lineSpan = sel.append("tspan").attr("x", ln.x).attr("y", ln.y);
    if (!ln.runs || !ln.runs.length) {
      lineSpan.text(ln.text);
      continue;
    }
    for (const run of ln.runs) {
      if (run.style && (run.style.weight !== undefined || run.style.style !== undefined)) {
        const styleParts: string[] = [];
        if (run.style.weight !== undefined)
          styleParts.push(`font-weight: ${run.style.weight}`);
        if (run.style.style !== undefined)
          styleParts.push(`font-style: ${run.style.style}`);
        lineSpan
          .append("tspan")
          .attr("style", styleParts.join("; "))
          .text(run.text);
      } else {
        lineSpan.append("tspan").text(run.text);
      }
    }
  }
}

/** Applies paint attributes to a selection or transition. */
function applyPaint(target: any, node: SceneNode, resolveFill: (f?: string) => string | null): void {
  const p = node.paint || {};
  target
    .attr("fill", resolveFill(p.fill))
    .attr("fill-opacity", p.fillOpacity ?? null)
    .attr("stroke", p.stroke ?? null)
    .attr("stroke-width", p.strokeWidth ?? null)
    .attr("stroke-opacity", p.strokeOpacity ?? null)
    .attr("stroke-dasharray", p.strokeDasharray ? p.strokeDasharray.join(" ") : null)
    .attr("stroke-linecap", p.strokeLinecap ?? null)
    .attr("vector-effect", p.vectorEffect ?? null)
    .attr("shape-rendering", p.shapeRendering ?? null)
    .attr("opacity", p.opacity ?? null);
}

/** Sets a path's `d`, morphing via interpolatePath when animating on a transition. */
function setPath(target: any, d: string, animated: boolean): void {
  if (animated)
    target.attrTween("d", function (this: Element) {
      return interpolatePath(this.getAttribute("d") || d, d);
    });
  else target.attr("d", d);
}

/** Applies geometry + paint + transform to a selection (animated=false) or transition. */
function applyGeometry(
  target: any,
  node: SceneNode,
  animated: boolean,
  resolveFill: (f?: string) => string | null,
): void {
  switch (node.type) {
    case "rect":
      target
        .attr("x", node.x)
        .attr("y", node.y)
        .attr("width", node.width)
        .attr("height", node.height)
        .attr("rx", node.rx ?? null)
        .attr("ry", node.ry ?? null);
      break;
    case "circle":
      target.attr("cx", node.cx).attr("cy", node.cy).attr("r", node.r);
      break;
    case "line":
      setPath(target, linePath(node), animated);
      break;
    case "area":
      setPath(target, areaPath(node), animated);
      break;
    case "path":
      setPath(target, node.d, animated);
      break;
    case "image":
      target
        .attr("x", node.x)
        .attr("y", node.y)
        .attr("width", node.width)
        .attr("height", node.height);
      break;
    case "text":
      target.attr("x", node.x).attr("y", node.y);
      break;
    case "group":
      // clip handling is a follow-up; groups only carry transform/paint for now.
      break;
  }
  applyPaint(target, node, resolveFill);
  target.attr("transform", transformStr(node));
}

/**
    A Renderer backend that realizes a Scene as SVG, using a keyed enter/update/exit
    join with d3-transition. This is the parity target — the same mechanism the
    existing Shape classes use, generalized to consume scene nodes.
*/
export default class SvgRenderer implements Renderer {
  readonly kind = "svg" as const;

  private _target?: RenderTarget;
  private _svg?: SVGSVGElement;
  private _root?: SVGGElement;
  /** Sibling host for HtmlOverlayNode mounts. Positioned absolutely over the svg. */
  private _overlayHost?: HTMLDivElement;
  private _scene?: Scene;
  private _index = new Map<string, SceneNode>();
  private _textureDefs = new Map<string, {url: () => string}>();
  private _handlers = new Set<(event: SceneEvent) => void>();
  private _domListeners: Record<string, (e: Event) => void> = {};
  private _listening = false;
  private _hoverKey: string | number | null = null;
  private _timers = new Set<ReturnType<typeof setTimeout>>();

  mount(target: RenderTarget): void {
    this._target = target;
    // The container needs to be position-relative so absolutely-positioned
    // overlay children (and the svg) layer correctly.
    const containerStyle =
      target.container instanceof HTMLElement ? target.container.style : null;
    if (containerStyle && !containerStyle.position) {
      containerStyle.position = "relative";
    }
    const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    svg.setAttribute("class", "d3plus-render-svg");
    svg.style.display = "block";
    target.container.appendChild(svg);
    this._svg = svg;
    this.resize(target.width, target.height);
    const root = document.createElementNS(SVG_NS, "g") as SVGGElement;
    root.setAttribute("class", "d3plus-render-root");
    svg.appendChild(root);
    this._root = root;
    // Overlay host for HtmlOverlayNode mounts. Pointer-events default to
    // none so overlays don't intercept svg interactions unless they
    // explicitly opt in via a style override per overlay.
    const overlayHost = document.createElement("div");
    overlayHost.setAttribute("class", "d3plus-render-overlays");
    overlayHost.style.position = "absolute";
    overlayHost.style.top = "0";
    overlayHost.style.left = "0";
    overlayHost.style.width = "100%";
    overlayHost.style.height = "100%";
    overlayHost.style.pointerEvents = "none";
    target.container.appendChild(overlayHost);
    this._overlayHost = overlayHost;
  }

  resize(width: number, height: number): void {
    if (!this._svg) return;
    this._svg.setAttribute("width", String(width));
    this._svg.setAttribute("height", String(height));
    this._svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  drawScene(scene: Scene, opts?: DrawOptions): RenderHandle {
    if (!this._root || !this._svg)
      throw new Error("SvgRenderer.drawScene called before mount()");

    const duration = opts?.duration ?? 0;
    this._scene = scene;
    this._index = new Map();
    buildIndex(scene.root, this._index);

    if (scene.meta?.background)
      this._svg.style.background = scene.meta.background;

    const t = transition().duration(duration);
    this._reconcile(select(this._root) as any, scene.root.children, duration, t);
    this._reconcileOverlays(scene);

    let cancelled = false;
    const finished = new Promise<void>(resolve => {
      if (!duration) {
        opts?.onEnd?.();
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        this._timers.delete(timer);
        if (!cancelled) opts?.onEnd?.();
        resolve();
      }, duration + 10);
      this._timers.add(timer);
    });

    return {
      finished,
      cancel: () => {
        cancelled = true;
        if (this._root) select(this._root).selectAll("*").interrupt();
      },
    };
  }

  /**
      Resolves a scene fill to an SVG paint value. A "pattern:<json>" token is
      materialized into a textures.js <pattern> in the svg, cached by its key.
  */
  private _resolveFill(fill?: string): string | null {
    if (fill == null) return null;
    if (!fill.startsWith("pattern:") || !this._svg) return fill;
    const key = fill.slice("pattern:".length);
    let def = this._textureDefs.get(key);
    if (!def) {
      const config = JSON.parse(key) as Record<string, any> & {texture: string};
      const textureClass = config.texture;
      delete (config as Record<string, unknown>).texture;
      const t = (textures as any)[textureClass]();
      for (const k in config) {
        if (k in t) {
          if (Array.isArray(config[k])) t[k](...config[k]);
          else t[k](config[k]);
        }
      }
      select(this._svg).call(t);
      def = t as {url: () => string};
      this._textureDefs.set(key, def);
    }
    return def.url();
  }

  private _reconcile(
    parent: any,
    children: SceneNode[],
    duration: number,
    t: any,
  ): void {
    // HtmlOverlay nodes live outside the SVG; they're reconciled separately
    // by `_reconcileOverlays` against the sibling overlay host.
    const svgChildren = children.filter(c => c.type !== "htmlOverlay");
    const ordered = [...svgChildren].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
    const sel = parent.selectChildren("*").data(ordered, (d: SceneNode) => d.key);
    const resolveFill = (f?: string): string | null => this._resolveFill(f);

    const exit = sel.exit();
    if (duration) exit.transition(t).attr("opacity", 0).remove();
    else exit.remove();

    const enter = sel
      .enter()
      .append((d: SceneNode) => document.createElementNS(SVG_NS, tagFor(d)));
    enter.each(function (this: Element, d: SceneNode) {
      const s = select(this);
      applyStatic(s, d);
      applyGeometry(s, collapse(d), false, resolveFill);
    });

    const merged = enter.merge(sel);
    merged.order();

    const self = this;
    merged.each(function (this: Element, d: SceneNode) {
      const s = select(this);
      applyStatic(s, d);
      if (duration) applyGeometry((s as any).transition(t), d, true, resolveFill);
      else applyGeometry(s, d, false, resolveFill);
      if (d.type === "group")
        self._reconcile(s as any, (d as GroupNode).children, duration, t);
    });
  }

  /**
      Reconciles HtmlOverlay scene nodes into the sibling overlay-host div.
      Walks the entire scene tree, accumulating overlays + their inherited
      transform offsets (from ancestor group transforms), then keys them by
      `node.key` for enter/update/exit. Overlay DOM is intentionally outside
      the SVG so it can host arbitrary HTML (links, buttons, foreign-content)
      that SVG's `<foreignObject>` doesn't always portably support.
  */
  private _reconcileOverlays(scene: Scene): void {
    if (!this._overlayHost) return;
    const collected: {node: import("../scene.js").HtmlOverlayNode; ox: number; oy: number}[] = [];
    const walk = (n: SceneNode, ox: number, oy: number): void => {
      const tx = n.transform?.x ?? 0;
      const ty = n.transform?.y ?? 0;
      const cx = ox + tx;
      const cy = oy + ty;
      if (n.type === "htmlOverlay") {
        collected.push({node: n, ox: cx, oy: cy});
      } else if (n.type === "group") {
        for (const c of (n as GroupNode).children) walk(c, cx, cy);
      }
    };
    walk(scene.root, 0, 0);
    const sel = select(this._overlayHost)
      .selectChildren<HTMLDivElement, unknown>(".d3plus-render-overlay")
      .data(collected, (d: any) => String(d.node.key));
    sel.exit().remove();
    const enter = sel
      .enter()
      .append("div")
      .attr("class", "d3plus-render-overlay")
      .style("position", "absolute")
      .style("pointer-events", "auto");
    enter
      .merge(sel as any)
      .each(function (this: HTMLDivElement, d: any) {
        const o = d.node as import("../scene.js").HtmlOverlayNode;
        this.style.left = `${d.ox + o.x}px`;
        this.style.top = `${d.oy + o.y}px`;
        if (o.width !== undefined) this.style.width = `${o.width}px`;
        if (o.height !== undefined) this.style.height = `${o.height}px`;
        if (o.className) this.className = `d3plus-render-overlay ${o.className}`;
        if (o.style) {
          for (const k in o.style)
            (this.style as unknown as Record<string, string>)[k] = String(o.style[k]);
        }
        if (this.innerHTML !== o.html) this.innerHTML = o.html;
        if (o.onMount) o.onMount(this);
      });
  }

  pick(point: [number, number]): PickResult | null {
    if (!this._svg) return null;
    const rect = this._svg.getBoundingClientRect();
    const el = document.elementFromPoint(rect.left + point[0], rect.top + point[1]);
    return this._pickFromElement(el);
  }

  private _pickFromElement(el: Element | null): PickResult | null {
    let cur: Element | null = el;
    while (cur && cur !== this._svg) {
      const k = cur.getAttribute("data-key");
      if (k !== null) {
        const node = this._index.get(k);
        if (node && node.interactive !== false)
          return {node, datum: node.datum, index: node.index};
      }
      cur = cur.parentElement;
    }
    return null;
  }

  on(handler: (event: SceneEvent) => void): () => void {
    this._handlers.add(handler);
    if (!this._listening) this._attachListeners();
    return () => {
      this._handlers.delete(handler);
    };
  }

  private _attachListeners(): void {
    if (!this._svg) return;
    this._listening = true;
    const svg = this._svg;
    const local = (e: MouseEvent): [number, number] => {
      const rect = svg.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    };
    const emit = (type: string, e: MouseEvent): void => {
      const point = local(e);
      const pick = this._pickFromElement(e.target as Element);
      if (type === "mousemove") {
        const key = pick?.node.key ?? null;
        if (key !== this._hoverKey) {
          if (this._hoverKey !== null)
            this._dispatch({type: "mouseleave", point, pick: null, nativeEvent: e});
          this._hoverKey = key;
          if (key !== null)
            this._dispatch({type: "mouseenter", point, pick, nativeEvent: e});
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
          this._dispatch({
            type: "mouseleave",
            point: local(e as MouseEvent),
            pick: null,
            nativeEvent: e,
          });
          this._hoverKey = null;
        }
      },
    };
    for (const [k, fn] of Object.entries(this._domListeners))
      svg.addEventListener(k, fn);
  }

  private _dispatch(event: SceneEvent): void {
    for (const h of this._handlers) h(event);
  }

  toSVGString(): string {
    return this._svg ? this._svg.outerHTML : "";
  }

  destroy(): void {
    for (const timer of this._timers) clearTimeout(timer);
    this._timers.clear();
    if (this._svg) {
      for (const [k, fn] of Object.entries(this._domListeners))
        this._svg.removeEventListener(k, fn);
      this._svg.remove();
    }
    if (this._overlayHost) {
      this._overlayHost.remove();
      this._overlayHost = undefined;
    }
    this._handlers.clear();
    this._domListeners = {};
    this._listening = false;
    this._svg = undefined;
    this._root = undefined;
    this._scene = undefined;
    this._index = new Map();
    this._textureDefs = new Map();
    this._target = undefined;
  }
}
