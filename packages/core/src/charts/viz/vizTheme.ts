/**
    Resolves a chart's `theme` once per draw and hands it to the chart's
    components, and paints a forced theme's background into the scene.

    @module
*/

import type {PathNode, RectNode, SceneNode} from "@d3plus/render";

import type BaseClass from "../../utils/BaseClass.js";
import {resolveTheme, themed, themeStyle} from "../../utils/theme.js";
import type {
  ResolvedTheme,
  ThemeOverlayTokens,
  ThemeSetting,
} from "../../utils/theme.js";
import {cascadeTheme} from "../../utils/themeInk.js";
import {pageTheme, unwatchPageTheme, watchPageTheme} from "./pageTheme.js";

type Rect = {x: number; y: number; width: number; height: number};

export {unwatchPageTheme};
import type {VizInstance} from "./vizTypes.js";

/**
    Resolves the chart's theme for this draw onto `viz._theme` and its
    components, and keeps an `"auto"` chart watching its page for a flip
    between light and dark (a forced theme stops watching).
*/
export function applyVizTheme(viz: VizInstance): ResolvedTheme {
  const setting = viz.schema.theme as ThemeSetting | undefined;
  const theme = resolveTheme(setting, pageTheme(viz), viz.schema.colorDefaults);
  viz._theme = theme;
  cascadeTheme(viz as unknown as BaseClass, theme);
  if (theme.painted) unwatchPageTheme(viz);
  else watchPageTheme(viz);
  return theme;
}

type BackgroundTarget = Pick<VizInstance, "_theme" | "schema"> &
  Partial<Pick<VizInstance, "_margin" | "_ssr" | "_tileGroup">>;

/**
    The chart area a Geomap's ocean and tiles cover in the page, beneath the
    painted scene (a server render paints them in the scene instead).
*/
function underlay(viz: BackgroundTarget): Rect | undefined {
  if (viz._ssr || !viz._tileGroup || !viz._margin) return undefined;
  const {top, right, bottom, left} = viz._margin;
  const {width, height} = viz.schema;
  return {
    x: left,
    y: top,
    width: width - left - right,
    height: height - top - bottom,
  };
}

/**
    The scene node a forced theme paints behind the chart, if it has one: a
    rect over the whole chart, framing (not covering) a Geomap's basemap.
*/
export function themeBackgroundNode(
  viz: BackgroundTarget,
): RectNode | PathNode | undefined {
  const theme = viz._theme;
  if (!theme?.painted) return undefined;
  const {width, height} = viz.schema;
  const base = {
    key: "viz-background",
    interactive: false,
    paint: {fill: theme.background},
  };
  const hole = underlay(viz);
  if (!hole) return {...base, type: "rect", x: 0, y: 0, width, height};
  // The hole winds the other way, so the nonzero fill leaves it empty.
  const {x, y} = hole;
  return {
    ...base,
    type: "path",
    d:
      `M0,0H${width}V${height}H0Z` +
      `M${x},${y}V${y + hole.height}H${x + hole.width}V${y}Z`,
  };
}

/** The forced theme's background rect, as the scene's first children. */
export function themeBackground(viz: BackgroundTarget): SceneNode[] {
  const node = themeBackgroundNode(viz);
  return node ? [node] : [];
}

/**
    The `color-scheme` the chart's overlays use, so their native controls
    (buttons, the search input, the download menu) match the theme: the
    theme's own when forced or dark, and the page's otherwise.
*/
export function themeColorScheme(theme: ResolvedTheme | undefined): string {
  if (!theme || !(theme.painted || theme.dark)) return "";
  return theme.dark ? "dark" : "light";
}

/** Sets the chart's overlay host's `color-scheme` (see `themeColorScheme`). */
export function applyOverlayColorScheme(
  viz: Pick<VizInstance, "_theme" | "_sceneRenderer">,
): void {
  const scheme = themeColorScheme(viz._theme);
  const elements: Element[] = viz._sceneRenderer?.elements?.() ?? [];
  for (const el of elements)
    if (el.localName === "div" && "style" in el)
      (el as HTMLElement).style.colorScheme = scheme;
}

/**
    An overlay style with each entry still at its built-in default swapped for
    the theme's overlay color: `keys` maps a CSS property to the overlay token
    it takes, and `format` wraps a token (`1px solid …`). Light charts keep
    the built-in style (see `themed`).
*/
export function themeOverlayStyle<T extends Record<string, unknown>>(
  viz: Pick<VizInstance, "_theme">,
  style: T,
  defaults: Record<string, unknown>,
  keys: Record<string, (overlay: ThemeOverlayTokens) => string>,
): T {
  const overrides: Record<string, string | undefined> = {};
  for (const [key, pick] of Object.entries(keys))
    overrides[key] = themed(viz._theme, t => pick(t.overlay), undefined);
  return themeStyle(style, defaults, overrides);
}
