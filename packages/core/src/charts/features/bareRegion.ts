/**
    A map region drawn for no data row (a Geomap's basemap region, or a tile
    grid's empty tile): its datum is the wrapper around its topojson feature,
    with no `data`. It isn't a data row, so the chart's `label` accessor,
    which reads rows, doesn't label it.
*/

/** What a region's wrapper holds. */
interface RegionWrapper {
  __d3plus__?: boolean;
  data?: unknown;
  feature?: {properties?: Record<string, unknown> | null} | null;
  id?: unknown;
}

/**
    Whether `d` is a region drawn for no data row.
    @param d A datum.
*/
export function isBareRegion(d: unknown): boolean {
  const w = d as RegionWrapper | null | undefined;
  return Boolean(w && w.__d3plus__ && w.feature && w.data == null);
}

/**
    A region's own name: its feature's `properties.name`, else its id (the
    `topojsonId` of its feature), as a region that no `label` names reads.
    `undefined` for anything but a region drawn for no data row.
    @param d A datum.
*/
export function bareRegionName(d: unknown): string | undefined {
  if (!isBareRegion(d)) return undefined;
  const w = d as RegionWrapper;
  const name = w.feature?.properties?.name;
  if (typeof name === "string" && name) return name;
  return w.id === undefined || w.id === null ? "" : `${w.id}`;
}
