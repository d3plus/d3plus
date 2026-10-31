/** One chart in the home page's hero loop. */
export interface Scene {
  /** The `@d3plus/core` class. */
  chart: string;
  config: Record<string, unknown>;
}

/** Turns off everything but the chart itself: the loop is for looking at. */
const QUIET = {
  legend: false,
  tooltip: false,
  zoom: false,
  saveControl: false,
  search: false,
  tableView: false,
  duration: 900,
};

/** Axis titles off: the loop shows the chart, not the data's field names. */
const UNTITLED = {xConfig: {title: false}, yConfig: {title: false}};

const nested = [
  ["Energy", "Solar", 34],
  ["Energy", "Wind", 27],
  ["Energy", "Hydro", 15],
  ["Energy", "Nuclear", 12],
  ["Transport", "Rail", 22],
  ["Transport", "Shipping", 18],
  ["Transport", "Aviation", 9],
  ["Food", "Grains", 25],
  ["Food", "Produce", 16],
  ["Food", "Dairy", 8],
  ["Housing", "Heating", 19],
  ["Housing", "Cooling", 11],
  ["Housing", "Lighting", 5],
].map(([parent, id, value]) => ({parent, id, value}));

const genres: Record<string, number[]> = {
  Rock: [38, 36, 33, 30, 27, 24, 21, 19, 17, 15, 14],
  Pop: [22, 24, 27, 29, 30, 31, 30, 29, 28, 27, 26],
  "Hip-Hop": [8, 10, 13, 16, 20, 24, 28, 31, 33, 34, 35],
  Electronic: [4, 5, 6, 8, 11, 14, 16, 17, 17, 16, 15],
  Country: [12, 12, 11, 11, 12, 12, 13, 13, 14, 14, 15],
  Jazz: [6, 6, 5, 5, 5, 4, 4, 4, 4, 4, 4],
};
const streams = Object.entries(genres).flatMap(([genre, shares]) =>
  shares.map((share, i) => ({genre, year: 2014 + i, share})),
);

const flows = [
  ["Solar", "Grid", 30],
  ["Wind", "Grid", 25],
  ["Hydro", "Grid", 14],
  ["Gas", "Grid", 20],
  ["Gas", "Industry", 16],
  ["Grid", "Homes", 38],
  ["Grid", "Industry", 31],
  ["Grid", "Transport", 20],
  ["Industry", "Exports", 22],
].map(([source, target, value]) => ({source, target, value}));

const codebase = [
  ["Frontend", "Components", "Table", 410],
  ["Frontend", "Components", "Modal", 240],
  ["Frontend", "Components", "Button", 120],
  ["Frontend", "Pages", "Dashboard", 520],
  ["Frontend", "Pages", "Settings", 180],
  ["Backend", "API", "Orders", 460],
  ["Backend", "API", "Users", 330],
  ["Backend", "API", "Search", 210],
  ["Backend", "Database", "Migrations", 380],
  ["Backend", "Database", "Models", 290],
  ["Infrastructure", "Deploy", "Terraform", 210],
  ["Infrastructure", "Deploy", "Containers", 160],
  ["Docs", "Reference", "API Reference", 260],
  ["Docs", "Guides", "Getting Started", 85],
].map(([area, module, file, size]) => ({area, module, file, size}));

const goals = [
  ["Move", 92],
  ["Exercise", 78],
  ["Stand", 66],
  ["Sleep", 54],
  ["Water", 41],
].map(([goal, percent]) => ({goal, percent}));

const trade = [
  ["Asia", "Europe", 30],
  ["Asia", "Americas", 24],
  ["Europe", "Asia", 18],
  ["Europe", "Americas", 15],
  ["Americas", "Asia", 20],
  ["Americas", "Europe", 12],
  ["Africa", "Europe", 9],
  ["Africa", "Asia", 8],
  ["Oceania", "Asia", 10],
].map(([source, target, value]) => ({source, target, value}));

/** The loop, in order: shapes alternate so each change reads as a change. */
export const SCENES: Scene[] = [
  {
    chart: "Treemap",
    config: {data: nested, groupBy: ["parent", "id"], sum: "value"},
  },
  {
    chart: "Streamgraph",
    config: {
      data: streams,
      groupBy: "genre",
      x: "year",
      y: "share",
      ...UNTITLED,
    },
  },
  {
    chart: "Pack",
    config: {data: nested, groupBy: ["parent", "id"], sum: "value"},
  },
  {
    chart: "Sankey",
    config: {links: flows, value: "value"},
  },
  {
    chart: "Sunburst",
    config: {
      data: codebase,
      groupBy: ["area", "module", "file"],
      sum: "size",
    },
  },
  {
    chart: "BarChart",
    config: {
      data: streams.filter(d => d.year >= 2018),
      groupBy: "genre",
      x: "year",
      y: "share",
      stacked: true,
      ...UNTITLED,
    },
  },
  {
    chart: "RadialBar",
    config: {data: goals, groupBy: "goal", value: "percent"},
  },
  {
    chart: "Chord",
    config: {links: trade, value: "value"},
  },
].map(scene => ({...scene, config: {...QUIET, ...scene.config}}));

/** How long each chart stays up, in milliseconds. */
export const DWELL = 4500;

/** The scene after `index`, wrapping to the first. */
export const nextScene = (index: number) => (index + 1) % SCENES.length;
