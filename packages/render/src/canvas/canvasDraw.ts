import type {SceneNode, TextNode} from "../scene.js";
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
  ctx.font = `${baseStyle} ${baseWeight} ${size}px ${family}`;
  ctx.textAlign =
    f.anchor === "middle" ? "center" : f.anchor === "end" ? "right" : "left";
  ctx.textBaseline =
    f.baseline === "middle"
      ? "middle"
      : f.baseline === "hanging"
        ? "hanging"
        : "alphabetic";
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
        paint(run.text, cursor, ln.y);
        cursor += ctx.measureText(run.text).width;
      }
      ctx.font = `${baseStyle} ${baseWeight} ${size}px ${family}`;
      ctx.textAlign = prevAlign;
    } else {
      paint(ln.text, ln.x, ln.y);
    }
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
