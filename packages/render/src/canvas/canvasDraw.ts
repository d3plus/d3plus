import type {SceneNode, TextLine, TextNode} from "../scene.js";
import {anchorSide, lineLeft} from "../textAlign.js";
import {
  pathFont,
  pathGlyphs,
  pathLineStart,
  placeGlyphs,
  textPathSamples,
} from "../textPath.js";
import {solidFill} from "./canvasNodePaint.js";

type Ctx = CanvasRenderingContext2D;

/** Paints a text node's laid-out lines, run by run where a line carries styled runs, over its halo when it has one. */
export function drawText(ctx: Ctx, node: TextNode, alpha: number): void {
  const p = node.paint || {};
  if (node.halo && p.stroke && (p.strokeWidth ?? 1) > 0) {
    ctx.globalAlpha = alpha * (p.strokeOpacity ?? 1);
    ctx.strokeStyle = solidFill(p.stroke) ?? "#000";
    ctx.lineWidth = p.strokeWidth ?? 1;
    ctx.lineJoin = "round";
    paintLines(ctx, node, (text, x, y) => ctx.strokeText(text, x, y));
  }
  ctx.globalAlpha = alpha * (p.fillOpacity ?? 1);
  ctx.fillStyle = solidFill(p.fill) ?? "#000";
  paintLines(ctx, node, (text, x, y) => ctx.fillText(text, x, y));
}

/** Sets a text node's font and alignment, then paints each line (or styled run) with `paint`. */
function paintLines(
  ctx: Ctx,
  node: TextNode,
  paint: (text: string, x: number, y: number) => void,
): void {
  const f = node.font || {};
  const baseStyle = f.style ?? "normal";
  const baseWeight = f.weight ?? "normal";
  const size = f.size ?? 12;
  const family = f.family ?? "sans-serif";
  const prevDirection = ctx.direction;
  // The direction orders the glyphs within each painted string; the
  // alignment is physical (left/right), read from the anchor and direction.
  if (f.dir) ctx.direction = f.dir;
  ctx.font = `${baseStyle} ${baseWeight} ${size}px ${family}`;
  const side = anchorSide(f.anchor, f.dir);
  ctx.textAlign = side;
  ctx.textBaseline =
    f.baseline === "middle"
      ? "middle"
      : f.baseline === "hanging"
        ? "hanging"
        : "alphabetic";
  if (node.path) {
    paintPathLine(ctx, node, paint);
    ctx.direction = prevDirection;
    return;
  }
  for (const ln of node.lines) {
    if (ln.runs && ln.runs.length) {
      paintRuns(ctx, node, ln, paint);
      ctx.font = `${baseStyle} ${baseWeight} ${size}px ${family}`;
      ctx.textAlign = side;
    } else {
      paint(ln.text, ln.x, ln.y);
    }
  }
  ctx.direction = prevDirection;
}

/**
    Paints a text node's first line along its path, piece by piece (see
    `pathGlyphs`): each at the point its midpoint reaches, turned to the path
    there, as SVG's `<textPath>` places glyphs.
*/
function paintPathLine(
  ctx: Ctx,
  node: TextNode,
  paint: (text: string, x: number, y: number) => void,
): void {
  const placed = pathLineStart(node);
  if (!placed || !node.path) return;
  const f = node.font || {};
  const runs = placed.line.runs?.length
    ? placed.line.runs.map(r => ({text: r.text, font: pathFont(f, r.style)}))
    : [{text: placed.line.text, font: pathFont(f)}];
  const measure = (text: string, font?: string) => {
    ctx.font = font ?? pathFont(f);
    return ctx.measureText(text).width;
  };
  const glyphs = pathGlyphs(runs, f.dir === "rtl", measure);
  for (const g of placeGlyphs(
    textPathSamples(node.path),
    placed.start,
    glyphs,
  )) {
    ctx.save();
    ctx.font = g.font ?? pathFont(f);
    ctx.textAlign = "center";
    if (g.dir) ctx.direction = g.dir;
    ctx.translate(g.x, g.y);
    ctx.rotate(g.angle);
    paint(g.text, 0, 0);
    ctx.restore();
  }
}

/**
    Paints a line's runs one after another in its reading direction, each with
    its own weight and style. A run with its own x starts there (read with the
    node's anchor and direction); the others follow the run before.
*/
function paintRuns(
  ctx: Ctx,
  node: TextNode,
  ln: TextLine,
  paint: (text: string, x: number, y: number) => void,
): void {
  const f = node.font || {};
  const size = f.size ?? 12;
  const family = f.family ?? "sans-serif";
  const rtl = f.dir === "rtl";
  // Runs flow from the line's start edge: its left in LTR, its right in RTL.
  const left = lineLeft(ln, f);
  let cursor = rtl ? left + (ln.width || 0) : left;
  ctx.textAlign = rtl ? "right" : "left";
  for (const run of ln.runs ?? []) {
    ctx.font = `${run.style?.style ?? f.style ?? "normal"} ${
      run.style?.weight ?? f.weight ?? "normal"
    } ${size}px ${family}`;
    const w = ctx.measureText(run.text).width;
    if (run.x !== undefined) {
      const runLeft = lineLeft({x: run.x, width: w}, f);
      cursor = rtl ? runLeft + w : runLeft;
    }
    paint(run.text, cursor, ln.y);
    cursor += rtl ? -w : w;
  }
}

/**
    Paints a decoded image into an image node's box, honoring its
    `preserveAspectRatio` (`slice` covers, `meet` contains, otherwise it
    stretches).
*/
export function drawImage(
  ctx: Ctx,
  node: Extract<SceneNode, {type: "image"}>,
  img: HTMLImageElement,
  alpha: number,
): void {
  ctx.globalAlpha = alpha;
  const par = node.preserveAspectRatio;
  const iw = img.naturalWidth || img.width,
    ih = img.naturalHeight || img.height;
  if (par && par.includes("slice")) {
    // CSS `cover`: scale the image to fill the box, cropping the overflow
    // (centered), via drawImage's source-rect crop.
    const scale = Math.max(node.width / iw, node.height / ih);
    const sw = node.width / scale,
      sh = node.height / scale;
    ctx.drawImage(
      img,
      (iw - sw) / 2,
      (ih - sh) / 2,
      sw,
      sh,
      node.x,
      node.y,
      node.width,
      node.height,
    );
  } else if (par && par !== "none" && par.includes("meet")) {
    // CSS `contain`: fit the whole image inside the box (centered).
    const scale = Math.min(node.width / iw, node.height / ih);
    const dw = iw * scale,
      dh = ih * scale;
    ctx.drawImage(
      img,
      node.x + (node.width - dw) / 2,
      node.y + (node.height - dh) / 2,
      dw,
      dh,
    );
  } else {
    ctx.drawImage(img, node.x, node.y, node.width, node.height);
  }
}
