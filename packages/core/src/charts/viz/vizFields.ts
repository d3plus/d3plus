import type {ConfigField} from "../../fluent.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import {registerLink} from "./linkGroup.js";
import {onDataPollingIntervalSet} from "./vizDataPolling.js";
import type Viz from "./Viz.js";
import type {VizInstance} from "./vizTypes.js";

/** A falsy value (no color) is stored as given, a key string read from each datum. */
export const optionalAccessor = (value: unknown): unknown =>
  !value || typeof value === "function"
    ? value
    : fieldAccessor(value as string);

/**
    The config keys every chart has, as generated accessors (`viz.<key>(value)`
    sets, `viz.<key>()` gets): stored as given, wrapped as a constant
    (`coerce: "const"`), or deep-merged into the current object
    (`merge: true`). Each key's description and type live on `D3plusConfig`,
    which the docs generator documents them from (keying this map by
    `D3plusConfig` keeps the two in step); defaults are seeded in
    `vizDefaults.ts`.
*/
const fields = {
  aggs: {merge: true},
  ariaHidden: {},
  attribution: {},
  attributionIcon: {},
  attributionStyle: {merge: true},
  backControlClassName: {},
  backControlStyle: {},
  cache: {},
  color: {coerce: optionalAccessor},
  colorOrdinal: {default: false},
  colorScale: {coerce: optionalAccessor},
  colorScaleConfig: {merge: true},
  colorScaleMaxSize: {},
  colorScalePadding: {coerce: "const"},
  colorScalePosition: {coerce: "const"},
  dataCutoff: {},
  dataPollingInterval: {
    onSet: (viz: VizInstance) =>
      onDataPollingIntervalSet(viz as unknown as Viz),
  },
  depth: {},
  detectResize: {},
  detectResizeDelay: {},
  detectVisible: {},
  detectVisibleInterval: {},
  detectVisibleUnload: {},
  discrete: {},
  duration: {},
  filter: {},
  height: {},
  hiddenColor: {coerce: "const"},
  hiddenOpacity: {coerce: "const"},
  label: {coerce: "const"},
  legend: {coerce: "const"},
  legendConfig: {merge: true},
  legendFilterInvert: {coerce: "const"},
  legendInset: {},
  legendInsetConfig: {merge: true},
  legendPadding: {coerce: "const"},
  legendPosition: {coerce: "const"},
  legendSort: {},
  legendTooltip: {merge: true},
  link: {onSet: (viz: VizInstance) => registerLink(viz)},
  loadingHTML: {coerce: "const"},
  loadingMessage: {},
  messageMask: {},
  messageStyle: {merge: true},
  minimap: {},
  minimapClassName: {},
  minimapLabelStyle: {},
  minimapStyle: {},
  minimapViewportStyle: {},
  minimapViewportStyleActive: {},
  noDataHTML: {coerce: "const"},
  noDataMessage: {},
  reducedMotion: {},
  saveControl: {},
  saveControlClassName: {},
  saveControlConfig: {merge: true},
  saveControlMenuClassName: {},
  saveControlMenuItemStyle: {},
  saveControlMenuItemStyleHover: {},
  saveControlMenuStyle: {},
  saveControlStyle: {},
  saveControlStyleActive: {},
  saveControlStyleHover: {},
  scrollContainer: {},
  search: {},
  searchAccessor: {},
  searchControlClassName: {},
  searchControlStyle: {},
  searchControlStyleActive: {},
  searchControlStyleHover: {},
  shape: {coerce: "const"},
  sizeLegend: {coerce: "const"},
  sizeLegendConfig: {merge: true},
  sizeLegendPosition: {},
  subtitle: {coerce: "const"},
  subtitleConfig: {merge: true},
  subtitlePadding: {coerce: "const"},
  svgDesc: {},
  svgTitle: {},
  tableView: {},
  tableViewClassName: {},
  tableViewControlClassName: {},
  tableViewControlStyle: {},
  tableViewControlStyleActive: {},
  tableViewControlStyleHover: {},
  tableViewDownload: {},
  tableViewPageSize: {},
  tableViewSort: {},
  thresholdName: {coerce: "const"},
  timeFilter: {},
  timeline: {},
  timelineConfig: {merge: true},
  timelinePadding: {coerce: "const"},
  title: {coerce: "const"},
  titleConfig: {merge: true},
  titlePadding: {coerce: "const"},
  tooltip: {coerce: "const"},
  tooltipConfig: {merge: true},
  totalConfig: {merge: true},
  totalFormat: {},
  totalPadding: {coerce: "const"},
  width: {},
  zoom: {},
  zoomBrushHandleSize: {},
  zoomBrushHandleStyle: {},
  zoomBrushSelectionStyle: {},
  zoomControlClassName: {},
  zoomControlIcons: {},
  zoomControlStyle: {},
  zoomControlStyleActive: {},
  zoomControlStyleHover: {},
  zoomFactor: {},
  zoomMax: {},
  zoomPadding: {},
  zoomPan: {},
  zoomScroll: {},
} satisfies {[K in keyof D3plusConfig]?: Omit<ConfigField, "key">};

/** The keys of `vizFields`. */
export type VizFieldKey = keyof typeof fields;

export const vizFields: ConfigField[] = Object.entries(fields).map(
  ([key, field]) => ({key, ...field}),
);
