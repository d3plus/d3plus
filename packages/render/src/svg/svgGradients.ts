/**
    The `<linearGradient>` elements an SVG renderer paints `gradient:<json>`
    tokens with, in its `<defs>`.
*/
import {parseGradient} from "../scene.js";
import type {SceneGradient} from "../scene.js";
import {SVG_NS} from "./svgNodeAttrs.js";

/** Writes a gradient's geometry and stops onto its element. */
function writeGradient(el: SVGLinearGradientElement, g: SceneGradient): void {
  // userSpaceOnUse anchors the gradient to the painted node's own
  // coordinates; the default is objectBoundingBox (from/to in 0–1, relative
  // to the node's bounds).
  if (g.units === "userSpaceOnUse")
    el.setAttribute("gradientUnits", "userSpaceOnUse");
  else el.removeAttribute("gradientUnits");
  el.setAttribute("x1", String(g.from[0]));
  el.setAttribute("y1", String(g.from[1]));
  el.setAttribute("x2", String(g.to[0]));
  el.setAttribute("y2", String(g.to[1]));
  el.replaceChildren(
    ...g.stops.map(({offset, color}) => {
      const stop = document.createElementNS(SVG_NS, "stop");
      stop.setAttribute("offset", String(offset));
      stop.setAttribute("stop-color", color);
      return stop;
    }),
  );
}

/** A gradient element kept for one node's paint. */
interface OwnedGradient {
  el: SVGLinearGradientElement;
  url: string;
  token: string;
  /** The draw that last wrote it. */
  draw: number;
}

/**
    Materializes gradient tokens as `<linearGradient>`s. An objectBoundingBox
    gradient fits whatever node it paints, so each token gets one element,
    shared. A userSpaceOnUse gradient sits in its node's own coordinates, so
    it moves with every draw that moves the node (a mark colored by its
    values): each node's paint (its `owner`) keeps one element, rewritten
    when its token changes, rather than adding an element per token. Two
    nodes claiming one owner in the same draw (a shared key) fall back to an
    element per token. `defs`/`uid` are getters so it binds lazily to the
    renderer's state.
*/
export class GradientDefs {
  private byToken = new Map<string, string>();
  private byOwner = new Map<string, OwnedGradient>();
  private seq = 0;
  private draw = 0;

  constructor(
    private defs: () => SVGDefsElement | undefined,
    private uid: () => number,
  ) {}

  /** A new, empty `<linearGradient>` in `<defs>`, with its url. */
  private create(defs: SVGDefsElement): {
    el: SVGLinearGradientElement;
    url: string;
  } {
    const id = `d3plus-gradient-${this.uid()}-${++this.seq}`;
    const el = document.createElementNS(SVG_NS, "linearGradient");
    el.setAttribute("id", id);
    defs.appendChild(el);
    return {el, url: `url(#${id})`};
  }

  /** Starts a draw: a node's gradient written from here on replaces its last one. */
  nextDraw(): void {
    this.draw++;
  }

  /**
      The `url(#id)` that paints a `gradient:<json>` token, or `"none"` for a
      bad one.
      @param token The token.
      @param owner The node and paint the token is for (e.g. `"line:stroke"`).
  */
  resolve(token: string, owner?: string): string {
    const cached = this.byToken.get(token);
    if (cached) return cached;
    const g = parseGradient(token);
    const defs = this.defs();
    if (!g || !defs) return "none";
    const entry = owner !== undefined ? this.byOwner.get(owner) : undefined;
    if (entry?.token === token) return entry.url;
    if (
      owner !== undefined &&
      g.units === "userSpaceOnUse" &&
      entry?.draw !== this.draw
    ) {
      const next = entry ?? {...this.create(defs), token, draw: this.draw};
      if (!next.el.isConnected) defs.appendChild(next.el);
      next.token = token;
      next.draw = this.draw;
      writeGradient(next.el, g);
      this.byOwner.set(owner, next);
      return next.url;
    }
    const {el, url} = this.create(defs);
    writeGradient(el, g);
    this.byToken.set(token, url);
    return url;
  }

  /** Forgets every gradient (the elements go with the torn-down `<defs>`). */
  clear(): void {
    this.byToken.clear();
    this.byOwner.clear();
    this.seq = 0;
  }
}
