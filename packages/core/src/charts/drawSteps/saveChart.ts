/**
    Saves a chart as a PNG, SVG, or JPG file through `@d3plus/export`'s
    `saveElement`, for the top-left download button (`saveControl.ts`).

    Only the drawing is saved: the chart's `<svg>` on the SVG backend, its
    `<canvas>` on the Canvas backend. The controls, the open menu, and
    tooltips live in HTML outside that element, so they never reach the
    file. An SVG file from a Canvas chart re-renders the retained scene
    through the SVG backend (`viz.toSVGString()`).

    @module
*/
import {saveElement} from "@d3plus/export";

import type {SaveControlConfig, SaveFormat} from "../../utils/D3plusConfig.js";
import {chartBackground} from "../viz/backgroundInk.js";
import type Viz from "../viz/Viz.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Every format the download button can save, in its default menu order. */
export const SAVE_FORMATS: SaveFormat[] = ["png", "svg", "jpg"];

/** The valid, de-duplicated formats in `value`, or every format when `value` isn't an array. */
export function saveFormats(value: unknown): SaveFormat[] {
  if (!Array.isArray(value)) return SAVE_FORMATS.slice();
  const formats: SaveFormat[] = [];
  for (const v of value) {
    const format = String(v).toLowerCase().replace("jpeg", "jpg");
    if (
      SAVE_FORMATS.includes(format as SaveFormat) &&
      !formats.includes(format as SaveFormat)
    )
      formats.push(format as SaveFormat);
  }
  return formats;
}

/**
    A filename (without extension) from a title: markup and characters that
    file systems reject are dropped, whitespace collapsed, and the result
    capped at 100 characters. `"download"` when nothing is left.
*/
export function saveFilename(title: unknown): string {
  const name =
    typeof title === "string" || typeof title === "number"
      ? String(title)
          .replace(/<[^>]*>/g, "")
          .replace(/[\\/:*?"<>|\p{Cc}]/gu, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 100)
          .trim()
      : "";
  return name || "download";
}

/** The page color behind the chart. */
function pageBackground(viz: Viz): string {
  return chartBackground({_select: viz._select});
}

/** The chart's resolved title text, or `undefined` when it has none. */
function chartTitle(viz: Viz): unknown {
  const title = viz.schema.title;
  return typeof title === "function"
    ? title(viz._filteredData || [])
    : undefined;
}

export interface ResolvedSaveConfig {
  filename: string;
  formats: SaveFormat[];
  background: string | false;
  callback?: (error?: Error) => void;
  renderOptions: Record<string, unknown>;
}

/** `saveControlConfig` with its defaults applied. */
export function resolveSaveConfig(viz: Viz): ResolvedSaveConfig {
  const {
    filename,
    formats,
    background,
    callback,
    ...renderOptions
  }: SaveControlConfig = viz.schema.saveControlConfig || {};
  return {
    filename:
      typeof filename === "string" && filename.trim()
        ? saveFilename(filename)
        : saveFilename(chartTitle(viz)),
    formats: saveFormats(formats),
    background:
      background === false
        ? false
        : typeof background === "string" && background
          ? background
          : pageBackground(viz),
    callback: typeof callback === "function" ? callback : undefined,
    renderOptions,
  };
}

/** The chart's drawing surface: its `<canvas>` on the Canvas backend, else its `<svg>`. */
export function saveTarget(viz: Viz): HTMLElement | SVGElement | null {
  const node =
    viz._renderer === "canvas" ? viz.toCanvas() : viz._select?.node?.();
  const tag = viz._renderer === "canvas" ? "canvas" : "svg";
  return (node as Element | null)?.localName === tag
    ? (node as HTMLElement | SVGElement)
    : null;
}

/** Page-placement attributes and styles a saved file has no use for. */
const PAGE_STYLES = [
  "position",
  "top",
  "left",
  "content-visibility",
  "touch-action",
];

/** Drops the on-page placement from a copy of the chart's `<svg>`. */
function standalone(svg: SVGSVGElement): void {
  svg.removeAttribute("aria-hidden");
  for (const prop of PAGE_STYLES) svg.style?.removeProperty(prop);
}

/**
    A detached copy of the chart's `<svg>` to save as a file, with a rect
    filling `background` behind everything (none when `false`). The SVG
    backend copies its live `<svg>`; the Canvas backend parses the scene
    re-rendered as SVG markup.
*/
export function svgForSave(
  viz: Viz,
  background: string | false,
): SVGSVGElement | null {
  let svg: Element | null = null;
  if (viz._renderer === "canvas") {
    const markup = viz.toSVGString();
    if (markup) {
      const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
      svg = doc.querySelector("parsererror") ? null : doc.documentElement;
    }
  } else {
    const node = saveTarget(viz);
    svg = node ? (node.cloneNode(true) as Element) : null;
    if (svg) standalone(svg as SVGSVGElement);
  }
  if (!svg || svg.localName !== "svg") return null;
  if (background) {
    const rect = svg.ownerDocument.createElementNS(SVG_NS, "rect");
    rect.setAttribute("class", "d3plus-save-background");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", background);
    svg.insertBefore(rect, svg.firstChild);
  }
  return svg as SVGSVGElement;
}

/**
    Saves the chart as a `format` file, named and styled by
    `saveControlConfig`. Errors go to its `callback`, or to the console.
*/
export function saveChart(viz: Viz, format: SaveFormat): void {
  const {filename, background, callback, renderOptions} =
    resolveSaveConfig(viz);
  const done = (error?: Error): void => {
    if (callback) callback(error);
    else if (error) console.error(error);
  };
  const unrendered = (): void =>
    done(new Error("The chart has not been rendered, so it cannot be saved."));

  if (format === "svg") {
    const svg = svgForSave(viz, background);
    if (!svg) return unrendered();
    saveElement(svg, {filename, type: "svg", callback: done});
    return;
  }
  const target = saveTarget(viz);
  if (!target) return unrendered();
  // A JPG has no transparency: without a background its empty pixels are black.
  const backgroundColor =
    background || (format === "jpg" ? pageBackground(viz) : undefined);
  saveElement(
    target,
    {filename, type: format, callback: done},
    {...renderOptions, backgroundColor},
  );
}
