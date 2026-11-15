/**
    Geomap's tile state: whether the tiles show, the URL template they load
    from, the box they cover, and the credit they carry.

    @module
*/

import attributions from "../helpers/tileAttributions.js";
import {chartBounds} from "../features/chartGeometry.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {resolveThemed} from "./basemapTheme.js";
import type {Themed} from "./basemapTheme.js";
import {regionsReshaped} from "./tileGrid.js";

/** The credit for the tile server `url` names, or false for one without. */
function findAttribution(url: string): string | false {
  const a = attributions.find((d: {matches: string[]; text: string}) =>
    d.matches.some((m: string) => url.includes(m)),
  );
  return a ? a.text : false;
}

/** The tile layer's extent: the map rect in `_container`'s own (margin-relative) space. */
export function tileExtent(
  viz: VizInstance,
): [[number, number], [number, number]] {
  const {width, height} = chartBounds(viz);
  return [
    [0, 0],
    [width, height],
  ];
}

/** The tile URL template for the chart's current light/dark backdrop. */
export function currentTileUrl(viz: VizInstance): string {
  return resolveThemed(
    viz.schema.tileUrl as Themed<string>,
    Boolean(viz._basemapDark),
  );
}

/**
    Keeps the tile credit in sync with the active tile URL (a `{light, dark}`
    pair can mix providers), unless the attribution was set by hand.
*/
export function syncTileAttribution(viz: VizInstance): void {
  const auto = tilesShown(viz) ? findAttribution(currentTileUrl(viz)) : false;
  const current = viz.schema.attribution;
  if (!current || current === viz._tileAttribution)
    viz.schema.attribution = auto || "";
  viz._tileAttribution = auto;
}

/** Whether the map draws its tiles: `tiles` is on, and no cartogram or tile grid hides them. */
export function tilesShown(viz: VizInstance): boolean {
  return Boolean(viz.schema.tiles) && !regionsReshaped(viz);
}
