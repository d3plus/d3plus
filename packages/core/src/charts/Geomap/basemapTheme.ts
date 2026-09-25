/**
    Light/dark basemaps. `tileUrl` and `ocean` accept either one value or a
    `{light, dark}` pair; a pair resolves against the chart's backdrop each
    draw, and the chart redraws when that backdrop flips.

    @module
*/

import {lab} from "d3-color";

import type {VizInstance} from "../viz/vizTypes.js";

/** A value, or one per page theme. */
export type Themed<T> = T | {light: T; dark: T};

/** Esri's Canvas basemaps: muted, nearly label-free bases for data overlays. */
export const DEFAULT_TILE_URL: Themed<string> = {
  light: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
};

/** The Canvas basemaps' own water colors, so the ocean around the tiles matches. */
export const DEFAULT_OCEAN: Themed<string> = {light: "#d0cfd4", dark: "#222327"};

const isPair = <T>(value: Themed<T>): value is {light: T; dark: T} =>
  typeof value === "object" && value !== null && "light" in value && "dark" in value;

/** Picks a themed value's light or dark side. */
export function resolveThemed<T>(value: Themed<T>, dark: boolean): T {
  return isPair(value) ? (dark ? value.dark : value.light) : value;
}

/** Whether a Geomap has any themed value that depends on the backdrop. */
export function isThemed(viz: VizInstance): boolean {
  return isPair(viz.schema.tileUrl) || isPair(viz.schema.ocean);
}

/**
    Whether the chart sits on a dark backdrop: the first non-transparent
    background among its ancestors, or — when none sets one — the browser's
    own page canvas, which is dark only when the page opts into a dark
    `color-scheme` and the system prefers dark. Server renders are light.
*/
export function pageIsDark(viz: VizInstance): boolean {
  if (viz._ssr || typeof window === "undefined" || typeof getComputedStyle !== "function") return false;
  let node: Element | null = viz._select?.node() ?? null;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") return lab(bg).l < 50;
    node = node.parentElement;
  }
  const scheme = getComputedStyle(document.documentElement).colorScheme || "";
  if (!scheme.includes("dark")) return false;
  if (!scheme.includes("light")) return true;
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
    Redraws the chart when its backdrop changes theme: on a system theme
    change, or when the page flips a theme class/attribute/style on <html>
    or <body> (how most theme toggles work). Installed once per chart, and
    only while it uses a `{light, dark}` pair.
*/
export function watchPageTheme(viz: VizInstance): void {
  if (viz._themeWatch || viz._ssr || typeof window === "undefined") return;
  const check = () => {
    const host = viz._select?.node();
    if (!host || !host.isConnected) return;
    if (isThemed(viz) && pageIsDark(viz) !== viz._basemapDark) viz.render?.();
  };
  const media = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
  media?.addEventListener?.("change", check);
  const observer = typeof MutationObserver === "function" ? new MutationObserver(check) : null;
  for (const el of [document.documentElement, document.body])
    if (el) observer?.observe(el, {attributes: true});
  viz._themeWatch = true;
}
