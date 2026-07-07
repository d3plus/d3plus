import type {
  FontSpec,
  GroupNode,
  Paint,
  SceneNode,
  TextLine,
  Transform,
} from "./scene.js";

/** Reads an attribute, falling back to the inline style, parsed as a float (drops "px"). */
function numAttr(el: Element, name: string, cssName = name): number | undefined {
  const v = el.getAttribute(name) ?? (el as SVGElement).style?.getPropertyValue(cssName);
  if (v == null || v === "") return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Reads an attribute, falling back to the inline style, as a string. */
function strAttr(el: Element, name: string, cssName = name): string | undefined {
  const v = el.getAttribute(name) ?? (el as SVGElement).style?.getPropertyValue(cssName);
  return v == null || v === "" ? undefined : v;
}

/** Parses a leading translate/scale/rotate from an SVG transform string. */
function parseTransform(str: string | null): Transform | undefined {
  if (!str) return undefined;
  const t: Transform = {};
  const translate = /translate\(\s*([-\d.eE]+)[\s,]+([-\d.eE]+)/.exec(str);
  if (translate) {
    t.x = Number(translate[1]);
    t.y = Number(translate[2]);
  }
  const scale = /scale\(\s*([-\d.eE]+)/.exec(str);
  if (scale) t.scale = Number(scale[1]);
  const rotate = /rotate\(\s*([-\d.eE]+)(?:[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+))?/.exec(str);
  if (rotate) {
    t.rotate = Number(rotate[1]);
    if (rotate[2] !== undefined) t.rotateAnchor = [Number(rotate[2]), Number(rotate[3])];
  }
  return Object.keys(t).length ? t : undefined;
}

/** Reads presentation attributes (attr or inline style) into a Paint. */
function readPaint(el: Element): Paint | undefined {
  const p: Paint = {};
  const fill = strAttr(el, "fill");
  if (fill) p.fill = fill;
  const fo = numAttr(el, "fill-opacity");
  if (fo !== undefined) p.fillOpacity = fo;
  const stroke = strAttr(el, "stroke");
  if (stroke) p.stroke = stroke;
  const sw = numAttr(el, "stroke-width");
  if (sw !== undefined) p.strokeWidth = sw;
  const so = numAttr(el, "stroke-opacity");
  if (so !== undefined) p.strokeOpacity = so;
  const dash = strAttr(el, "stroke-dasharray");
  if (dash && dash !== "none") {
    const parts = dash.split(/[\s,]+/).map(Number).filter(n => Number.isFinite(n));
    if (parts.length) p.strokeDasharray = parts;
  }
  const cap = strAttr(el, "stroke-linecap");
  if (cap === "butt" || cap === "round" || cap === "square") p.strokeLinecap = cap;
  const ve = strAttr(el, "vector-effect");
  if (ve === "none" || ve === "non-scaling-stroke") p.vectorEffect = ve;
  const sr = strAttr(el, "shape-rendering");
  if (sr) p.shapeRendering = sr;
  const op = numAttr(el, "opacity");
  if (op !== undefined) p.opacity = op;
  return Object.keys(p).length ? p : undefined;
}

/** Reads font presentation into a FontSpec for a <text> element. */
function readFont(el: Element): FontSpec {
  const f: FontSpec = {};
  const family = strAttr(el, "font-family");
  if (family) f.family = family;
  const size = numAttr(el, "font-size");
  if (size !== undefined) f.size = size;
  const weight = strAttr(el, "font-weight");
  if (weight) f.weight = weight;
  const style = strAttr(el, "font-style");
  if (style === "italic") f.style = "italic";
  const anchor = strAttr(el, "text-anchor");
  if (anchor === "start" || anchor === "middle" || anchor === "end") f.anchor = anchor;
  const baseline = strAttr(el, "dominant-baseline");
  if (baseline === "middle" || baseline === "hanging" || baseline === "alphabetic")
    f.baseline = baseline;
  return f;
}

/**
    Converts a rendered SVG subtree into a scene graph. This is a migration bridge:
    components that haven't been natively ported to emit a scene (Axis, Legend, …)
    can be snapshotted from their rendered DOM so they participate in the scene and
    render through any backend (including Canvas), with parity guaranteed by being a
    faithful copy. Natively-ported shapes should emit their own precise toScene().
    @param el The root SVG element to convert.
    @param keyPrefix Prefix for synthesized keys on elements without a data-key.
*/
export function domToScene(el: Element, keyPrefix = "dom"): GroupNode {
  let counter = 0;

  const convert = (node: Element): SceneNode | null => {
    const tag = node.tagName.toLowerCase();
    if (tag === "defs" || tag === "clippath" || tag === "pattern" || tag === "title")
      return null;

    const key = node.getAttribute("data-key") ?? `${keyPrefix}-${counter++}`;
    const paint = readPaint(node);
    const transform = parseTransform(node.getAttribute("transform"));
    const base = {key, ...(paint ? {paint} : {}), ...(transform ? {transform} : {})};

    switch (tag) {
      case "g":
      case "svg": {
        const children: SceneNode[] = [];
        for (const child of Array.from(node.children)) {
          const c = convert(child as Element);
          if (c) children.push(c);
        }
        return {type: "group", ...base, children};
      }
      case "rect":
        return {
          type: "rect",
          ...base,
          x: numAttr(node, "x") ?? 0,
          y: numAttr(node, "y") ?? 0,
          width: numAttr(node, "width") ?? 0,
          height: numAttr(node, "height") ?? 0,
          ...(numAttr(node, "rx") !== undefined ? {rx: numAttr(node, "rx")} : {}),
          ...(numAttr(node, "ry") !== undefined ? {ry: numAttr(node, "ry")} : {}),
        };
      case "circle":
        return {
          type: "circle",
          ...base,
          cx: numAttr(node, "cx") ?? 0,
          cy: numAttr(node, "cy") ?? 0,
          r: numAttr(node, "r") ?? 0,
        };
      case "line":
        return {
          type: "line",
          ...base,
          points: [
            [numAttr(node, "x1") ?? 0, numAttr(node, "y1") ?? 0],
            [numAttr(node, "x2") ?? 0, numAttr(node, "y2") ?? 0],
          ],
        };
      case "polyline": {
        const pts = (node.getAttribute("points") ?? "")
          .trim()
          .split(/\s+/)
          .map(pair => pair.split(",").map(Number) as [number, number])
          .filter(p => p.length === 2 && p.every(Number.isFinite));
        return {type: "line", ...base, points: pts};
      }
      case "path":
        return {type: "path", ...base, d: node.getAttribute("d") ?? ""};
      case "image":
        return {
          type: "image",
          ...base,
          x: numAttr(node, "x") ?? 0,
          y: numAttr(node, "y") ?? 0,
          width: numAttr(node, "width") ?? 0,
          height: numAttr(node, "height") ?? 0,
          href: node.getAttribute("href") ?? node.getAttribute("xlink:href") ?? "",
        };
      case "text": {
        const tspans = Array.from(node.querySelectorAll("tspan"));
        const lines: TextLine[] =
          tspans.length > 0
            ? tspans.map(ts => ({
                text: ts.textContent ?? "",
                x: numAttr(ts, "x") ?? numAttr(node, "x") ?? 0,
                y: numAttr(ts, "y") ?? numAttr(node, "y") ?? 0,
                width: 0,
              }))
            : [{text: node.textContent ?? "", x: numAttr(node, "x") ?? 0, y: numAttr(node, "y") ?? 0, width: 0}];
        return {
          type: "text",
          ...base,
          x: numAttr(node, "x") ?? 0,
          y: numAttr(node, "y") ?? 0,
          lines,
          font: readFont(node),
        };
      }
      default:
        return null;
    }
  };

  const root = convert(el);
  if (root && root.type === "group") return root;
  return {type: "group", key: `${keyPrefix}-root`, children: root ? [root] : []};
}
