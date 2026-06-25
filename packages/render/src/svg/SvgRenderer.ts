/* eslint-disable @typescript-eslint/no-explicit-any */
import {select} from "d3-selection";
import {transition} from "d3-transition";
import textures from "textures";

import {collapse} from "../animate/interpolate.js";
import type {GroupNode, HtmlOverlayNode, Scene, SceneNode, TextNode} from "../scene.js";
import {parseGradient} from "../scene.js";
import {
  applyOverlayToElement,
  createOverlayHost,
  walkOverlays,
} from "../overlay.js";
import {
  applyGeometry,
  applyStatic,
  buildIndex,
  SVG_NS,
  tagFor,
  textFontTween,
} from "./svgNodeAttrs.js";
import type {
  DrawOptions,
  PickResult,
  RenderHandle,
  Renderer,
  RenderTarget,
  SceneEvent,
} from "../Renderer.js";

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
  /** Lazy <defs> for clipPaths / patterns. Created on first use. */
  private _defs?: SVGDefsElement;
  /** Stable id counter so each GroupNode clip gets a unique <clipPath>. */
  private _clipIds = new Map<string, string>();
  private _clipSeq = 0;
  /** Sibling host for HtmlOverlayNode mounts. Positioned absolutely over the svg. */
  private _overlayHost?: HTMLDivElement;
  private _scene?: Scene;
  private _index = new Map<string, SceneNode>();
  private _textureDefs = new Map<string, {url: () => string}>();
  /** Cache of `gradient:<json>` token → `url(#id)`, materialized in <defs>. */
  private _gradientDefs = new Map<string, string>();
  private _gradientSeq = 0;
  private _handlers = new Set<(event: SceneEvent) => void>();
  private _domListeners: Record<string, (e: Event) => void> = {};
  private _listening = false;
  private _hoverKey: string | number | null = null;
  private _timers = new Set<ReturnType<typeof setTimeout>>();
  private _invalidatePointerRect: (() => void) | null = null;
  private _removePointerRectListeners: (() => void) | null = null;
  /** Cancel handle for the latest drawScene transition; flipped on overlap. */
  private _cancelDraw: (() => void) | null = null;
  /** Marks `_index` as needing a rebuild before the next external read. */
  private _indexDirty = true;

  mount(target: RenderTarget): void {
    this._target = target;
    const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    svg.setAttribute("class", "d3plus-render-svg");
    svg.style.display = "block";
    // Transparent background — without this, default UA stylesheet may
    // give the svg a white background, which briefly bleeds through
    // during container resize while the new scene is paint-pending.
    svg.style.background = "transparent";
    target.container.appendChild(svg);
    this._svg = svg;
    this.resize(target.width, target.height);
    const root = document.createElementNS(SVG_NS, "g") as SVGGElement;
    root.setAttribute("class", "d3plus-render-root");
    svg.appendChild(root);
    this._root = root;
    // Overlay host for HtmlOverlayNode mounts — shared helper applies
    // pointer-events:none default + position:relative on container so
    // overlays don't intercept svg interactions unless explicitly
    // opted-in per overlay.
    this._overlayHost = createOverlayHost(target);
  }

  resize(width: number, height: number): void {
    if (!this._svg) return;
    this._svg.setAttribute("width", String(width));
    this._svg.setAttribute("height", String(height));
    this._svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (this._invalidatePointerRect) this._invalidatePointerRect();
  }

  /**
      Public view onto the mount target. v4: callers (e.g. `Viz._drawSceneToTarget`)
      use this to compare the current target's container against their
      desired one without reaching into the private `_target` field.
  */
  target(): RenderTarget | undefined {
    return this._target;
  }

  drawScene(scene: Scene, opts?: DrawOptions): RenderHandle {
    if (!this._root || !this._svg)
      throw new Error("SvgRenderer.drawScene called before mount()");

    // Cancel any prior in-flight transition before starting a new one.
    // Without this, the previous call's `onEnd` callback fires after
    // the new scene has already painted — leaving subscribers to think
    // the in-flight render finished when actually a newer one did.
    // Mirrors CanvasRenderer's `if (this._cancelAnim) this._cancelAnim();`
    // at the top of its drawScene.
    if (this._cancelDraw) this._cancelDraw();

    const duration = opts?.duration ?? 0;
    // Lazy `_index` rebuild: only walk the tree when the scene object
    // identity changes. Hit-testing via `_pickFromElement` doesn't read
    // `_index` (the d3 join + element-traversal handles it), and the
    // index is only consumed by external callers/tests; rebuilding on
    // every draw burns CPU on large scenes for no observable benefit.
    // Mark for lazy rebuild — first read will populate.
    const sceneChanged = this._scene !== scene;
    this._scene = scene;
    if (sceneChanged) this._indexDirty = true;

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

    const cancel = (): void => {
      cancelled = true;
      if (this._root) select(this._root).selectAll("*").interrupt();
    };
    this._cancelDraw = cancel;
    return {finished, cancel};
  }

  /** Lazily creates (once) and returns the shared <defs> element. */
  private _ensureDefs(): SVGDefsElement | undefined {
    if (this._defs || !this._svg) return this._defs;
    const defs = document.createElementNS(SVG_NS, "defs") as SVGDefsElement;
    this._svg.insertBefore(defs, this._svg.firstChild);
    this._defs = defs;
    return defs;
  }

  /**
      Materializes a `gradient:<json>` token into a <linearGradient> under
      <defs>, cached by token string, and returns its `url(#id)`. Coordinates
      are objectBoundingBox units, so the gradient scales to whatever node
      references it (no per-node geometry needed).
  */
  private _resolveGradient(fill: string): string {
    const cached = this._gradientDefs.get(fill);
    if (cached) return cached;
    const g = parseGradient(fill);
    const defs = this._ensureDefs();
    if (!g || !defs) return "none";
    const id = `d3plus-gradient-${++this._gradientSeq}`;
    const lg = document.createElementNS(SVG_NS, "linearGradient");
    lg.setAttribute("id", id);
    lg.setAttribute("x1", String(g.from[0]));
    lg.setAttribute("y1", String(g.from[1]));
    lg.setAttribute("x2", String(g.to[0]));
    lg.setAttribute("y2", String(g.to[1]));
    for (const {offset, color} of g.stops) {
      const stop = document.createElementNS(SVG_NS, "stop");
      stop.setAttribute("offset", String(offset));
      stop.setAttribute("stop-color", color);
      lg.appendChild(stop);
    }
    defs.appendChild(lg);
    const url = `url(#${id})`;
    this._gradientDefs.set(fill, url);
    return url;
  }

  /**
      Resolves a scene fill to an SVG paint value. A "pattern:<json>" token is
      materialized into a textures.js <pattern> in the svg, cached by its key;
      a "gradient:<json>" token into a <linearGradient> in <defs>.
  */
  private _resolveFill(fill?: string): string | null {
    if (fill == null) return null;
    if (fill.startsWith("gradient:")) return this._resolveGradient(fill);
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
    // by `_reconcileOverlays` against the sibling overlay host. Skip the
    // filter+slice allocations when no overlays are present (the common
    // case for deeply-nested chart groups). Skip the sort when no node
    // has `z` set — matches the CanvasRenderer fast path.
    let svgChildren: SceneNode[] = children;
    let hasOverlay = false;
    for (let i = 0; i < children.length; i++) {
      if (children[i].type === "htmlOverlay") {
        hasOverlay = true;
        break;
      }
    }
    if (hasOverlay)
      svgChildren = children.filter(c => c.type !== "htmlOverlay");
    let needsSort = false;
    for (let i = 0; i < svgChildren.length; i++) {
      if (svgChildren[i].z !== undefined) {
        needsSort = true;
        break;
      }
    }
    const ordered = needsSort
      ? [...svgChildren].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
      : svgChildren;
    const sel = parent.selectChildren("*").data(ordered, (d: SceneNode) => d.key);
    const resolveFill = (f?: string): string | null => this._resolveFill(f);

    const exit = sel.exit();
    // Free any clipPath entries owned by exiting groups so they don't
    // accumulate in <defs> across the chart's lifetime. _applyGroupClip
    // is only invoked on the merge selection (live groups); without
    // this exit cleanup, removed clipped groups leak <clipPath>
    // elements + _clipIds entries indefinitely.
    const self = this;
    exit.each(function (d: SceneNode) {
      if (d && d.type === "group") {
        self._releaseGroupClip(String((d as GroupNode).key));
      }
    });
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

    merged.each(function (this: Element, d: SceneNode) {
      const s = select(this);
      // A text label whose font-size changed eases into its new size/place
      // instead of snapping. `__d3plusTextPrev__` is the node this element drew
      // last time; comparing font sizes detects a resize. (The layout/tspans
      // are already at the new size — the tween scales the painted glyphs.)
      const prevText =
        duration && d.type === "text"
          ? ((this as any).__d3plusTextPrev__ as TextNode | undefined)
          : undefined;
      applyStatic(s, d);
      if (duration) {
        const tsel = (s as any).transition(t);
        applyGeometry(tsel, d, true, resolveFill);
        if (
          d.type === "text" &&
          prevText &&
          prevText.font &&
          (d as TextNode).font &&
          prevText.font.size !== (d as TextNode).font.size
        ) {
          // Override the transform tween: glide position/rotation and ease the
          // scale (old/new → 1) about the box center.
          tsel.attrTween("transform", textFontTween(prevText, d as TextNode));
        }
      } else applyGeometry(s, d, false, resolveFill);
      if (d.type === "text") (this as any).__d3plusTextPrev__ = d;
      if (d.type === "group") {
        self._applyGroupClip(this as SVGGElement, d as GroupNode);
        self._reconcile(s as any, (d as GroupNode).children, duration, t);
      }
    });
  }

  /**
      Materializes a GroupNode's `clip` (rect or path) into a <clipPath>
      under <defs> and links it via `clip-path="url(#…)"`. Idempotent per
      `node.key` — the same group reuses its clip element across draws.
  */
  /**
      Removes the <clipPath> and `_clipIds` entry owned by `key`. Called
      from the exit selection of `_reconcile` so removed groups don't
      leak their clip element forever.
  */
  private _releaseGroupClip(key: string): void {
    const id = this._clipIds.get(key);
    if (!id) return;
    if (this._defs) {
      const clipEl = this._defs.querySelector(`#${id}`);
      if (clipEl) clipEl.remove();
    }
    this._clipIds.delete(key);
  }

  private _applyGroupClip(el: SVGGElement, node: GroupNode): void {
    if (!node.clip) {
      // Drop any previously-applied clip (group's clip removed mid-life).
      const prev = this._clipIds.get(String(node.key));
      if (prev) {
        el.removeAttribute("clip-path");
        const clipEl = this._defs?.querySelector(`#${prev}`);
        if (clipEl) clipEl.remove();
        this._clipIds.delete(String(node.key));
      }
      return;
    }
    if (!this._defs && this._svg) {
      const defs = document.createElementNS(SVG_NS, "defs") as SVGDefsElement;
      this._svg.insertBefore(defs, this._svg.firstChild);
      this._defs = defs;
    }
    if (!this._defs) return;
    const keyStr = String(node.key);
    let id = this._clipIds.get(keyStr);
    if (!id) {
      id = `d3plus-clip-${++this._clipSeq}`;
      this._clipIds.set(keyStr, id);
    }
    let clipPath = this._defs.querySelector<SVGClipPathElement>(`#${id}`);
    if (!clipPath) {
      clipPath = document.createElementNS(SVG_NS, "clipPath") as SVGClipPathElement;
      clipPath.setAttribute("id", id);
      this._defs.appendChild(clipPath);
    }
    // Replace clip-shape child each draw — simpler than diffing.
    while (clipPath.firstChild) clipPath.removeChild(clipPath.firstChild);
    if (node.clip.type === "rect") {
      const r = document.createElementNS(SVG_NS, "rect");
      r.setAttribute("x", String(node.clip.x));
      r.setAttribute("y", String(node.clip.y));
      r.setAttribute("width", String(node.clip.width));
      r.setAttribute("height", String(node.clip.height));
      clipPath.appendChild(r);
    } else {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", node.clip.d);
      clipPath.appendChild(p);
    }
    el.setAttribute("clip-path", `url(#${id})`);
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
    const collected = walkOverlays(scene);
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
    // Tag enter rows so the unified merge pass knows which need onMount.
    enter.each(function (this: HTMLDivElement) {
      (this as unknown as {__justEntered: boolean}).__justEntered = true;
    });
    // `onMount` fires ONCE per host element (just after first populated).
    // `onUpdate` fires every draw. Both run AFTER innerHTML / style /
    // dimensions are written so a consumer's host.querySelector(...)
    // inside either hook sees the realized DOM. The
    // dimension/style/innerHTML/events block is identical to the
    // Canvas backend's — both delegate to `applyOverlayToElement`.
    enter
      .merge(sel as any)
      .each(function (this: HTMLDivElement, d: any) {
        applyOverlayToElement(this, d);
        const o = d.node as HtmlOverlayNode;
        const flags = this as unknown as {__justEntered?: boolean};
        if (flags.__justEntered) {
          flags.__justEntered = false;
          if (o.onMount) o.onMount(this);
        }
        if (o.onUpdate) o.onUpdate(this);
      });
  }

  pick(point: [number, number]): PickResult | null {
    if (!this._svg) return null;
    const rect = this._svg.getBoundingClientRect();
    const el = document.elementFromPoint(rect.left + point[0], rect.top + point[1]);
    return this._pickFromElement(el);
  }

  private _pickFromElement(el: Element | null): PickResult | null {
    // Build the index lazily on first read after a scene change. Avoids
    // walking the whole tree on every drawScene when nobody picks.
    if (this._indexDirty && this._scene) {
      this._index = new Map();
      buildIndex(this._scene.root, this._index);
      this._indexDirty = false;
    }
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
    // Cache the svg bounding rect so high-frequency pointer events
    // (mousemove during zoom drag) don't trigger forced layout reflow.
    let cachedRect: DOMRect | null = null;
    const invalidateRect = (): void => {
      cachedRect = null;
    };
    window.addEventListener("resize", invalidateRect, {passive: true});
    window.addEventListener("scroll", invalidateRect, {passive: true, capture: true});
    this._invalidatePointerRect = invalidateRect;
    this._removePointerRectListeners = () => {
      window.removeEventListener("resize", invalidateRect);
      window.removeEventListener("scroll", invalidateRect, {capture: true} as EventListenerOptions);
    };
    const local = (e: MouseEvent): [number, number] => {
      if (!cachedRect || (cachedRect.width === 0 && cachedRect.height === 0)) {
        cachedRect = svg.getBoundingClientRect();
      }
      return [e.clientX - cachedRect.left, e.clientY - cachedRect.top];
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
    if (this._removePointerRectListeners) {
      this._removePointerRectListeners();
      this._removePointerRectListeners = null;
      this._invalidatePointerRect = null;
    }
    this._svg = undefined;
    this._root = undefined;
    this._defs = undefined;
    this._clipIds.clear();
    this._clipSeq = 0;
    this._scene = undefined;
    this._index = new Map();
    this._textureDefs = new Map();
    this._gradientDefs.clear();
    this._gradientSeq = 0;
    this._target = undefined;
  }
}
