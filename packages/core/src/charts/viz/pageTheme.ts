/**
    Reads the page behind a chart (light or dark, and its background) and
    redraws an `"auto"` themed chart when the page flips between the two.

    @module
*/

import {isDarkColor} from "../../utils/theme.js";
import type {PageTheme} from "../../utils/theme.js";
import type {VizInstance} from "./vizTypes.js";

type PageTarget = Pick<VizInstance, "_select" | "_ssr">;

const WHITE = "rgb(255, 255, 255)";

/** Whether a computed background paints anything. */
const opaque = (bg: string | null | undefined): bg is string =>
  Boolean(bg) && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)";

/**
    The page behind the chart: the first non-transparent background among its
    ancestors decides, or, when none sets one, the browser's own page canvas,
    which is dark only when the page opts into a dark `color-scheme` and the
    system prefers dark. Server renders are light.
*/
export function pageTheme(viz: PageTarget): PageTheme {
  if (
    viz._ssr ||
    typeof window === "undefined" ||
    typeof getComputedStyle !== "function"
  )
    return {dark: false, background: WHITE};
  let node: Element | null = viz._select?.node?.() ?? null;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (opaque(bg)) return {dark: isDarkColor(bg), background: bg};
    node = node.parentElement;
  }
  const scheme = getComputedStyle(document.documentElement).colorScheme || "";
  const dark =
    scheme.includes("dark") &&
    (!scheme.includes("light") ||
      (typeof matchMedia === "function" &&
        matchMedia("(prefers-color-scheme: dark)").matches));
  return dark ? {dark} : {dark, background: WHITE};
}

/** Whether the chart sits on a dark page (see `pageTheme`). */
export function pageIsDark(viz: PageTarget): boolean {
  return pageTheme(viz).dark;
}

/**
    Calls `onFlip` whenever the page might have changed theme: on a system
    theme change, when the page flips a class/attribute/style on `<html>` or
    `<body>` (how most theme toggles work), or when a background transition
    ends. Returns the unsubscribe.
*/
export function watchPage(onFlip: () => void): () => void {
  if (typeof window === "undefined" || typeof document === "undefined")
    return () => undefined;
  const media =
    typeof matchMedia === "function"
      ? matchMedia("(prefers-color-scheme: dark)")
      : null;
  media?.addEventListener?.("change", onFlip);
  const observer =
    typeof MutationObserver === "function"
      ? new MutationObserver(onFlip)
      : null;
  for (const el of [document.documentElement, document.body])
    if (el) observer?.observe(el, {attributes: true});
  // A page that animates its background lands on the new color only once the
  // transition ends.
  const onTransition = (event: Event): void => {
    if (/background/.test((event as TransitionEvent).propertyName || ""))
      onFlip();
  };
  document.addEventListener("transitionend", onTransition);
  return () => {
    media?.removeEventListener?.("change", onFlip);
    observer?.disconnect();
    document.removeEventListener("transitionend", onTransition);
  };
}

/**
    Keeps an `"auto"` themed chart in step with its page: redraws it when the
    page's dark state differs from the one it last drew with. Installed once
    per chart; `unwatchPageTheme` removes it.
*/
export function watchPageTheme(viz: VizInstance): void {
  if (viz._themeWatch || viz._ssr || typeof window === "undefined") return;
  viz._themeWatch = watchPage(() => {
    const host = viz._select?.node?.();
    if (!host || !host.isConnected || !viz._theme || viz._theme.painted) return;
    if (pageIsDark(viz) !== viz._theme.dark) viz.render?.();
  });
}

/** Stops a chart's page-theme watcher, if it has one. */
export function unwatchPageTheme(viz: Pick<VizInstance, "_themeWatch">): void {
  viz._themeWatch?.();
  viz._themeWatch = undefined;
}
