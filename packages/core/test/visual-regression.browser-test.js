import {inject, it} from "vitest";
import {commands} from "vitest/browser";
import assert from "~test/browser/assert.js";

import {render} from "~test/browser/render.js";

/**
    Visual-regression safety net. Each chart renders in real Chromium (via
    the shared `render` helper) and we extract a structural fingerprint —
    every rendered shape's rounded bounding box (relative to the chart SVG)
    plus fill/stroke, in document order, alongside text content and per-tag
    counts. The fingerprint is compared against a committed JSON baseline.

    This snapshots the *rendered geometry*, not pixels: pixel diffs are
    fragile across machines/fonts and store binary blobs, whereas rounded
    bounding boxes catch real layout/emit regressions and diff cleanly in
    git. It is the tripwire that makes the pipeline-purity refactors safe —
    if shape geometry shifts, a baseline mismatch fails loudly.

    Baselines are environment-generated (Chromium layout + the host's
    default fonts). Regenerate intended changes with:

      pnpm vitest run packages/core/test/visual-regression.browser-test.js -u
*/

// Read and written through the test server, relative to the repo root.
const snapDir = "packages/core/test/snapshots/visual";
const UPDATE = inject("updateSnapshots");

// Each entry: [name, builderSrc]. The builder returns an UN-rendered,
// UN-selected viz; the in-page routine adds `.duration(0).select(...)` and
// renders it, so geometry is final (no mid-transition values).
const charts = [
  [
    "bar-chart",
    `lib => new lib.BarChart()
    .groupBy("group")
    .data([
      {group: "Alpha", x: "Q1", y: 35}, {group: "Alpha", x: "Q2", y: 50},
      {group: "Alpha", x: "Q3", y: 25}, {group: "Alpha", x: "Q4", y: 40},
      {group: "Beta",  x: "Q1", y: 20}, {group: "Beta",  x: "Q2", y: 30},
      {group: "Beta",  x: "Q3", y: 45}, {group: "Beta",  x: "Q4", y: 35},
    ]).x("x").y("y")`,
  ],
  [
    "line-plot",
    `lib => new lib.LinePlot()
    .groupBy("group")
    .data([
      {group: "S1", x: 1, y: 10}, {group: "S1", x: 2, y: 22}, {group: "S1", x: 3, y: 15},
      {group: "S1", x: 4, y: 28}, {group: "S1", x: 5, y: 35},
      {group: "S2", x: 1, y: 25}, {group: "S2", x: 2, y: 18}, {group: "S2", x: 3, y: 32},
      {group: "S2", x: 4, y: 26}, {group: "S2", x: 5, y: 38},
    ]).x("x").y("y")`,
  ],
  [
    "stacked-area",
    `lib => new lib.StackedArea()
    .groupBy("group")
    .data([
      {group: "A", x: 1, y: 10}, {group: "A", x: 2, y: 20}, {group: "A", x: 3, y: 15},
      {group: "A", x: 4, y: 25}, {group: "A", x: 5, y: 30},
      {group: "B", x: 1, y: 5},  {group: "B", x: 2, y: 12}, {group: "B", x: 3, y: 18},
      {group: "B", x: 4, y: 14}, {group: "B", x: 5, y: 20},
    ]).x("x").y("y")`,
  ],
  [
    "box-whisker",
    `lib => new lib.BoxWhisker()
    .groupBy("group")
    .data([
      {group: "A", x: "A", y: 10}, {group: "A", x: "A", y: 15}, {group: "A", x: "A", y: 20},
      {group: "A", x: "A", y: 25}, {group: "A", x: "A", y: 30}, {group: "A", x: "A", y: 35},
      {group: "B", x: "B", y: 12}, {group: "B", x: "B", y: 18}, {group: "B", x: "B", y: 24},
      {group: "B", x: "B", y: 28}, {group: "B", x: "B", y: 38}, {group: "B", x: "B", y: 45},
    ]).x("x").y("y")`,
  ],
  [
    "pie",
    `lib => new lib.Pie().data([
      {id: "Alpha", value: 30}, {id: "Beta", value: 22}, {id: "Gamma", value: 18},
      {id: "Delta", value: 15}, {id: "Epsilon", value: 10}, {id: "Zeta", value: 5},
    ])`,
  ],
  [
    "donut",
    `lib => new lib.Donut().data([
      {id: "Alpha", value: 30}, {id: "Beta", value: 22}, {id: "Gamma", value: 18},
      {id: "Delta", value: 15}, {id: "Epsilon", value: 10}, {id: "Zeta", value: 5},
    ])`,
  ],
  [
    "treemap",
    `lib => new lib.Treemap()
    .groupBy(["group", "id"])
    .data([
      {group: "Tech", id: "Alpha", value: 30}, {group: "Tech", id: "Beta", value: 25},
      {group: "Tech", id: "Gamma", value: 18}, {group: "Tech", id: "Delta", value: 12},
      {group: "Health", id: "Epsilon", value: 22}, {group: "Health", id: "Zeta", value: 16},
      {group: "Health", id: "Eta", value: 10}, {group: "Energy", id: "Theta", value: 14},
      {group: "Energy", id: "Iota", value: 8},
    ]).sum("value")`,
  ],
  [
    "pack",
    `lib => new lib.Pack()
    .groupBy(["group", "id"])
    .data([
      {group: "A", id: "1", value: 10}, {group: "A", id: "2", value: 20},
      {group: "A", id: "3", value: 15}, {group: "A", id: "4", value: 25},
      {group: "B", id: "5", value: 8},  {group: "B", id: "6", value: 18},
      {group: "B", id: "7", value: 12}, {group: "B", id: "8", value: 22},
    ]).sum("value")`,
  ],
  [
    "sunburst",
    `lib => new lib.Sunburst()
    .groupBy(["group", "sub", "id"])
    .data([
      {group: "Tech", sub: "Hardware", id: "Alpha", value: 30}, {group: "Tech", sub: "Hardware", id: "Beta", value: 25},
      {group: "Tech", sub: "Software", id: "Gamma", value: 18}, {group: "Tech", sub: "Software", id: "Delta", value: 12},
      {group: "Health", sub: "Care", id: "Epsilon", value: 22}, {group: "Health", sub: "Care", id: "Zeta", value: 16},
      {group: "Health", sub: "Pharma", id: "Eta", value: 10}, {group: "Energy", sub: "Power", id: "Theta", value: 14},
      {group: "Energy", sub: "Power", id: "Iota", value: 8},
    ]).sum("value")`,
  ],
  [
    "icicle",
    `lib => new lib.Icicle()
    .groupBy(["group", "sub", "id"])
    .data([
      {group: "Tech", sub: "Hardware", id: "Alpha", value: 30}, {group: "Tech", sub: "Hardware", id: "Beta", value: 25},
      {group: "Tech", sub: "Software", id: "Gamma", value: 18}, {group: "Tech", sub: "Software", id: "Delta", value: 12},
      {group: "Health", sub: "Care", id: "Epsilon", value: 22}, {group: "Health", sub: "Care", id: "Zeta", value: 16},
      {group: "Health", sub: "Pharma", id: "Eta", value: 10}, {group: "Energy", sub: "Power", id: "Theta", value: 14},
      {group: "Energy", sub: "Power", id: "Iota", value: 8},
    ]).sum("value")`,
  ],
  // `groupBy` must name both cell-identity dimensions — without it, every
  // row shares the global default nest key (`id`, absent here) and the
  // data-prep rollup merges all 9 rows into a single degenerate cell.
  [
    "matrix",
    `lib => new lib.Matrix().groupBy(["row", "column"]).data([
      {row: "R1", column: "C1", value: 10}, {row: "R1", column: "C2", value: 25},
      {row: "R1", column: "C3", value: 15}, {row: "R2", column: "C1", value: 30},
      {row: "R2", column: "C2", value: 20}, {row: "R2", column: "C3", value: 5},
      {row: "R3", column: "C1", value: 18}, {row: "R3", column: "C2", value: 12},
      {row: "R3", column: "C3", value: 28},
    ])`,
  ],
  [
    "tree",
    `lib => new lib.Tree()
    .groupBy(["parent", "id"])
    .data([
      {parent: "Group 1", id: "alpha"},
      {parent: "Group 1", id: "beta"},
      {parent: "Group 1", id: "gamma"},
      {parent: "Group 2", id: "delta"},
      {parent: "Group 2", id: "eta"},
    ])`,
  ],
  [
    "radar",
    `lib => new lib.Radar()
    .groupBy("id")
    .metric("axis")
    .value("number")
    .data([
      {id: "alpha", axis: "Central",    number: 170.992},
      {id: "alpha", axis: "Kirkdale",   number: 40},
      {id: "alpha", axis: "Kensington", number: 240},
      {id: "alpha", axis: "Everton",    number: 90},
      {id: "alpha", axis: "Picton",     number: 160},
      {id: "alpha", axis: "Riverside",  number: 30},
      {id: "beta",  axis: "Central",    number: 320},
      {id: "beta",  axis: "Kirkdale",   number: 97.5},
      {id: "beta",  axis: "Kensington", number: 40},
      {id: "beta",  axis: "Everton",    number: 110},
      {id: "beta",  axis: "Picton",     number: 40},
      {id: "beta",  axis: "Riverside",  number: 110},
    ])`,
  ],
  [
    "bump-chart",
    `lib => new lib.BumpChart()
    .groupBy("fruit")
    .discrete("x")
    .x("year")
    .y("rank")
    .data([
      {fruit: "apple",  year: 1, rank: 1}, {fruit: "apple",  year: 2, rank: 2}, {fruit: "apple",  year: 3, rank: 1},
      {fruit: "banana", year: 1, rank: 2}, {fruit: "banana", year: 2, rank: 4}, {fruit: "banana", year: 3, rank: 3},
      {fruit: "cherry", year: 1, rank: 4}, {fruit: "cherry", year: 2, rank: 3}, {fruit: "cherry", year: 3, rank: 2},
      {fruit: "orange", year: 1, rank: 3}, {fruit: "orange", year: 2, rank: 1}, {fruit: "orange", year: 3, rank: 4},
    ])`,
  ],
  [
    "sankey",
    `lib => new lib.Sankey()
    .links([
      {source: "alpha", target: "beta"},
      {source: "alpha", target: "gamma"},
      {source: "beta",  target: "delta"},
      {source: "beta",  target: "epsilon"},
      {source: "zeta",  target: "gamma"},
      {source: "theta", target: "gamma"},
      {source: "eta",   target: "gamma"},
    ])`,
  ],
  [
    "rings",
    `lib => new lib.Rings()
    .center("alpha")
    .links([
      {source: "alpha", target: "beta"},
      {source: "alpha", target: "gamma"},
      {source: "beta",  target: "delta"},
      {source: "beta",  target: "epsilon"},
      {source: "zeta",  target: "gamma"},
      {source: "theta", target: "gamma"},
      {source: "eta",   target: "gamma"},
    ])`,
  ],
  // Inline topojson (two squares) keeps the map fully offline — no remote
  // topojson/tile fetches — so the fingerprint stays deterministic in CI.
  [
    "geomap",
    `lib => new lib.Geomap()
    .groupBy("geo")
    .colorScale("value")
    .tiles(false)
    .ocean("transparent")
    .topojson({
      type: "Topology",
      objects: {geo: {type: "GeometryCollection", geometries: [
        {type: "Polygon", id: "a", arcs: [[0]]},
        {type: "Polygon", id: "b", arcs: [[1]]},
      ]}},
      arcs: [
        [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
        [[20, 0], [20, 10], [30, 10], [30, 0], [20, 0]],
      ],
    })
    .data([
      {geo: "a", value: 10},
      {geo: "b", value: 20},
    ])`,
  ],
  [
    "area-plot",
    `lib => new lib.AreaPlot()
    .groupBy("group")
    .data([
      {group: "A", x: 1, y: 10}, {group: "A", x: 2, y: 20}, {group: "A", x: 3, y: 15},
      {group: "A", x: 4, y: 25}, {group: "A", x: 5, y: 30},
      {group: "B", x: 1, y: 5},  {group: "B", x: 2, y: 12}, {group: "B", x: 3, y: 18},
      {group: "B", x: 4, y: 14}, {group: "B", x: 5, y: 20},
    ]).x("x").y("y")`,
  ],
  // Explicit node x/y so the force layout is fixed and the fingerprint stays
  // deterministic (no simulation jitter).
  [
    "network",
    `lib => new lib.Network()
    .nodes([
      {id: "A", x: -50, y: 0}, {id: "B", x: 50, y: 0},
      {id: "C", x: 0, y: -50}, {id: "D", x: 0, y: 50},
      {id: "E", x: -100, y: -50}, {id: "F", x: 100, y: 50},
    ])
    .links([
      {source: "A", target: "B"}, {source: "A", target: "C"},
      {source: "A", target: "D"}, {source: "B", target: "D"},
      {source: "C", target: "B"}, {source: "E", target: "A"},
      {source: "F", target: "B"},
    ])`,
  ],
  [
    "priestley",
    `lib => new lib.Priestley()
    .groupBy("group")
    .data([
      {id: "Era 1", start: 1900, end: 1925, group: "Period A"},
      {id: "Era 2", start: 1920, end: 1950, group: "Period B"},
      {id: "Era 3", start: 1945, end: 1975, group: "Period A"},
      {id: "Era 4", start: 1965, end: 1990, group: "Period B"},
      {id: "Era 5", start: 1985, end: 2010, group: "Period A"},
      {id: "Era 6", start: 2005, end: 2025, group: "Period B"},
    ])`,
  ],
  [
    "radial-matrix",
    `lib => new lib.RadialMatrix()
    .groupBy(["row", "column"])
    .column("column")
    .row("row")
    .colorScale("value")
    .data([
      {row: "Inner", column: "A", value: 10}, {row: "Inner", column: "B", value: 25},
      {row: "Inner", column: "C", value: 15}, {row: "Inner", column: "D", value: 20},
      {row: "Middle", column: "A", value: 18}, {row: "Middle", column: "B", value: 22},
      {row: "Middle", column: "C", value: 28}, {row: "Middle", column: "D", value: 12},
      {row: "Outer", column: "A", value: 30}, {row: "Outer", column: "B", value: 16},
      {row: "Outer", column: "C", value: 24}, {row: "Outer", column: "D", value: 8},
    ])`,
  ],
  [
    "chord",
    `lib => new lib.Chord()
    .value("value")
    .links([
      {source: "alpha", target: "beta",  value: 5},
      {source: "alpha", target: "gamma", value: 3},
      {source: "beta",  target: "gamma", value: 2},
      {source: "gamma", target: "alpha", value: 4},
      {source: "delta", target: "alpha", value: 6},
    ])`,
  ],
  // Fixed node positions keep the force layout deterministic; `.arrows("both")`
  // locks in the shared edge-arrow geometry.
  [
    "network-arrows",
    `lib => new lib.Network()
    .arrows("both")
    .nodes([
      {id: "A", x: -50, y: 0}, {id: "B", x: 50, y: 0}, {id: "C", x: 0, y: -50},
    ])
    .links([
      {source: "A", target: "B"}, {source: "A", target: "C"}, {source: "B", target: "C"},
    ])`,
  ],
  [
    "beeswarm",
    `lib => new lib.Beeswarm()
    .groupBy("id")
    .data(Array.from({length: 40}, (_, i) => ({id: "p" + i, group: ["Low", "High"][i % 2], value: (i * 37) % 23 + (i % 2) * 8})))
    .color("group")
    .x("value")`,
  ],
  [
    "bubble-chart",
    `lib => new lib.BubbleChart()
    .data([
      {id: "A", group: "x", gdp: 10, life: 60, pop: 4}, {id: "B", group: "y", gdp: 30, life: 70, pop: 25},
      {id: "C", group: "x", gdp: 32, life: 71, pop: 100}, {id: "D", group: "y", gdp: 50, life: 65, pop: 1},
      {id: "E", group: "x", gdp: 70, life: 75, pop: 64},
    ])
    .groupBy(["group", "id"])
    .x("gdp")
    .y("life")
    .size("pop")`,
  ],
  [
    "bullet",
    `lib => new lib.Bullet()
    .data([
      {id: "Revenue", value: 270, target: 250, unit: "USD (thousands)"},
      {id: "Profit", value: 22, target: 26, unit: "%"},
    ])
    .bands(d => (d.id === "Revenue" ? [150, 225, 300] : [10, 20, 30]))
    .subLabel("unit")`,
  ],
  [
    "calendar",
    `lib => new lib.Calendar()
    .data(Array.from({length: 60}, (_, k) => {
      const d = new Date(2024, 2, 1 + k);
      const pad = v => String(v).padStart(2, "0");
      return {date: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()), value: (k % 7) + 1};
    }))`,
  ],
  [
    "candlestick",
    `lib => new lib.Candlestick()
    .data([
      ["2024-01-02", 100, 104, 99, 103], ["2024-01-03", 103, 105, 101, 102],
      ["2024-01-04", 102, 103, 97, 98], ["2024-01-05", 98, 101, 96, 100],
      ["2024-01-08", 100, 106, 100, 105], ["2024-01-09", 105, 107, 103, 104],
      ["2024-01-10", 104, 104, 99, 100], ["2024-01-11", 100, 103, 98, 102],
    ].map(([date, open, high, low, close]) => ({symbol: "ACME", date, open, high, low, close})))
    .groupBy("symbol")`,
  ],
  [
    "dumbbell",
    `lib => new lib.Dumbbell()
    .data([
      {country: "Brazil", year: 2000, value: 70}, {country: "Brazil", year: 2020, value: 76},
      {country: "India", year: 2000, value: 63}, {country: "India", year: 2020, value: 70},
      {country: "Japan", year: 2000, value: 81}, {country: "Japan", year: 2020, value: 85},
    ])
    .groupBy("year")
    .x("value")
    .y("country")`,
  ],
  [
    "fan-chart",
    `lib => new lib.FanChart()
    .data(Array.from({length: 10}, (_, t) => {
      const row = {id: "CPI", year: 2000 + t, value: 10 + t};
      if (t >= 5) {
        const w = t - 5;
        Object.assign(row, {p5: row.value - 2 * w, p95: row.value + 2 * w, p25: row.value - w, p75: row.value + w});
      }
      return row;
    }))
    .groupBy("id")
    .x("year")
    .y("value")
    .confidence([["p5", "p95", "90%"], ["p25", "p75", "50%"]])
    .legend(false)`,
  ],
  [
    "funnel",
    `lib => new lib.Funnel()
    .data([
      {id: "Visited", value: 12400}, {id: "Pricing", value: 6900}, {id: "Trial", value: 3100},
      {id: "Activated", value: 1850}, {id: "Subscribed", value: 760},
    ])`,
  ],
  [
    "gauge",
    `lib => new lib.Gauge()
    .data([{id: "Speed", value: 72}])
    .domain([0, 100])
    .bands([{value: 50, label: "Low"}, {value: 80, label: "Medium"}, {value: 100, label: "High"}])`,
  ],
  [
    "hexbin",
    `lib => new lib.Hexbin()
    .data([[10, 10, 8], [30, 25, 4], [50, 15, 2], [70, 35, 6], [90, 5, 1], [60, 45, 3]]
      .flatMap(([x, y, n]) => Array.from({length: n}, () => ({x, y}))))
    .x("x")
    .y("y")`,
  ],
  [
    "histogram",
    `lib => new lib.Histogram()
    .data(Array.from({length: 60}, (_, i) => ({id: i, group: ["Low", "High"][i % 2], value: (i * 37) % 23 + (i % 2) * 8})))
    .groupBy("group")
    .value("value")`,
  ],
  [
    "lollipop",
    `lib => new lib.Lollipop()
    .data([
      {country: "Finland", kg: 12}, {country: "Norway", kg: 9.9}, {country: "Iceland", kg: 9},
      {country: "Denmark", kg: 8.7}, {country: "Sweden", kg: 8.2},
    ])
    .groupBy("country")
    .x("country")
    .y("kg")`,
  ],
  [
    "marimekko",
    `lib => new lib.Marimekko()
    .data([
      {Region: "North", Brand: "Acme", Revenue: 40}, {Region: "North", Brand: "Bolt", Revenue: 25},
      {Region: "South", Brand: "Acme", Revenue: 15}, {Region: "South", Brand: "Bolt", Revenue: 35},
      {Region: "West", Brand: "Acme", Revenue: 30}, {Region: "West", Brand: "Bolt", Revenue: 10},
    ])
    .groupBy("Brand")
    .x("Region")
    .y("Revenue")`,
  ],
  [
    "parallel-coordinates",
    `lib => new lib.ParallelCoordinates()
    .data([
      {name: "Alpha", origin: "USA", cylinders: 8, hp: 190, weight: 4300, mpg: 13},
      {name: "Bravo", origin: "USA", cylinders: 6, hp: 110, weight: 3200, mpg: 20},
      {name: "Delta", origin: "Japan", cylinders: 4, hp: 70, weight: 2100, mpg: 34},
      {name: "Echo", origin: "Japan", cylinders: 4, hp: 95, weight: 2400, mpg: 30},
      {name: "Foxtrot", origin: "Europe", cylinders: 4, hp: 78, weight: 2300, mpg: 31},
    ])
    .groupBy(["origin", "name"])`,
  ],
  [
    "polar-area",
    `lib => new lib.PolarArea()
    .data(["Jan", "Feb", "Mar", "Apr", "May", "Jun"].flatMap((month, i) => [
      {cause: "Disease", month, deaths: 40 + i * 12},
      {cause: "Wounds", month, deaths: 10 + i * 4},
    ]))
    .groupBy("cause")
    .metric("month")
    .value("deaths")`,
  ],
  [
    "pyramid",
    `lib => new lib.Pyramid()
    .data(["Male", "Female"].flatMap((sex, s) => ["0-9", "10-19", "20-29", "30-39"].map((age, b) => ({sex, age, population: 900 - b * 150 + s * 40}))))
    .groupBy("sex")
    .y("age")
    .x("population")`,
  ],
  [
    "radial-bar",
    `lib => new lib.RadialBar()
    .data([
      {id: "Safari", value: 20}, {id: "Chrome", value: 64}, {id: "Edge", value: 5}, {id: "Firefox", value: 15},
    ])`,
  ],
  [
    "ridgeline",
    `lib => new lib.Ridgeline()
    .data([["low", 2], ["mid", 5], ["high", 8]].flatMap(([id, mean]) =>
      Array.from({length: 30}, (_, i) => ({id, v: mean + ((i * 7) % 11 - 5) / 4}))))
    .groupBy("id")
    .value("v")`,
  ],
  [
    "scatter",
    `lib => new lib.Scatter()
    .data([
      {id: "a", x: 1.5, y: 40}, {id: "b", x: 4, y: 12}, {id: "c", x: 7.25, y: 33},
      {id: "d", x: 9, y: 25}, {id: "e", x: 5.5, y: 18},
    ])
    .groupBy("id")
    .x("x")
    .y("y")`,
  ],
  [
    "streamgraph",
    `lib => new lib.Streamgraph()
    .data(["Rock", "Pop", "Jazz", "Folk"].flatMap((genre, g) =>
      [2000, 2001, 2002, 2003, 2004, 2005].map((year, t) => ({genre, year, sales: 10 + g * 4 + ((t * (g + 3)) % 7) * 2}))))
    .groupBy("genre")
    .x("year")
    .y("sales")`,
  ],
  [
    "violin",
    `lib => new lib.Violin()
    .data([["low", 2], ["mid", 5], ["high", 8]].flatMap(([id, mean]) =>
      Array.from({length: 30}, (_, i) => ({id, v: mean + ((i * 7) % 11 - 5) / 4}))))
    .groupBy("id")
    .value("v")`,
  ],
  [
    "waffle",
    `lib => new lib.Waffle()
    .data([
      {source: "Car", value: 48}, {source: "Bus", value: 22}, {source: "Bike", value: 12}, {source: "Walk", value: 18},
    ])
    .groupBy("source")
    .sum("value")`,
  ],
  [
    "waterfall",
    `lib => new lib.Waterfall()
    .data([
      {item: "Revenue", amount: 420, sub: true}, {item: "Cost of Goods", amount: -180},
      {item: "Gross Profit", sub: true}, {item: "Marketing", amount: -45},
      {item: "Other Income", amount: 25}, {item: "Net Income", sub: true},
    ])
    .x("item")
    .y("amount")
    .subtotal("sub")`,
  ],
];

// Runs in-page: build + render the chart, then walk the rendered SVG and
// return a structural fingerprint. Self-contained — no closure over the
// test module (page.evaluate serializes this function).
const fingerprintFn = builderSrc =>
  new Promise((resolve, reject) => {
    try {
      const build = new Function("lib", `return (${builderSrc})(lib);`);
      const viz = build(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const svg = document.querySelector("#viz svg");
          if (!svg) return reject(new Error("no chart svg rendered"));
          const svgBox = svg.getBoundingClientRect();
          const r = n => Math.round(n);
          const shapeTags = new Set([
            "rect",
            "circle",
            "ellipse",
            "line",
            "path",
            "polygon",
            "polyline",
            "image",
          ]);
          const counts = {};
          const shapes = [];
          const texts = [];
          for (const el of svg.querySelectorAll("*")) {
            const tag = el.tagName.toLowerCase();
            // Skip definition-only geometry (clip paths, gradients, patterns).
            if (el.closest("defs") || el.closest("clipPath")) continue;
            if (tag === "text") {
              counts.text = (counts.text || 0) + 1;
              const content = (el.textContent || "").trim();
              if (content) {
                texts.push({
                  s: content,
                  a: el.getAttribute("text-anchor") || "",
                });
              }
              continue;
            }
            if (!shapeTags.has(tag)) continue;
            const b = el.getBoundingClientRect();
            // Zero-area defs/markers occasionally slip through; keep them so
            // their disappearance is still caught, but normalize NaN.
            counts[tag] = (counts[tag] || 0) + 1;
            shapes.push({
              t: tag,
              x: r(b.left - svgBox.left),
              y: r(b.top - svgBox.top),
              w: r(b.width),
              h: r(b.height),
              f: el.getAttribute("fill") || "",
              s: el.getAttribute("stroke") || "",
            });
          }
          resolve({
            counts,
            shapes,
            texts,
            chartScene: (viz._chartScene || []).length,
          });
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });

const body =
  '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>';

// Geometry tolerance (px). Rounded bounding boxes drift across platforms —
// Chromium's layout with the host's default fonts differs between a dev's Mac
// and Linux CI. Most charts drift <=1px, but text-positioned layouts shift by
// the label-area width difference (the Matrix grid offsets ~4px). Compare
// coordinates within a band that absorbs that font-metric drift while still
// failing real regressions (which move geometry far more, or change structure);
// shape counts, tags, fills, and text content are matched exactly.
const GEOM_TOL = 6;

async function compare(name, actual) {
  const file = `${snapDir}/${name}.json`;
  if (UPDATE) {
    await commands.writeFile(file, `${JSON.stringify(actual, null, 2)}\n`);
    return;
  }
  const saved = await commands.readFile(file).catch(() => null);
  assert.ok(
    saved !== null,
    `no baseline for "${name}" — generate with \`vitest run -u\``,
  );
  const expected = JSON.parse(saved);
  const hint = " If intended, regenerate with `vitest run -u`.";

  // A changed per-tag count, tspan/label, or text anchor is a structural
  // regression — match those exactly.
  assert.deepStrictEqual(
    actual.counts,
    expected.counts,
    `visual snapshot count mismatch for "${name}".${hint}`,
  );
  assert.deepStrictEqual(
    actual.texts,
    expected.texts,
    `visual snapshot text mismatch for "${name}".${hint}`,
  );

  // Shapes: same sequence and same tag/fill/stroke; geometry within GEOM_TOL px.
  assert.strictEqual(
    actual.shapes.length,
    expected.shapes.length,
    `visual snapshot shape-count mismatch for "${name}".${hint}`,
  );
  actual.shapes.forEach((a, i) => {
    const e = expected.shapes[i];
    assert.strictEqual(
      a.t,
      e.t,
      `shape ${i} tag mismatch for "${name}".${hint}`,
    );
    assert.strictEqual(
      a.f,
      e.f,
      `shape ${i} fill mismatch for "${name}".${hint}`,
    );
    assert.strictEqual(
      a.s,
      e.s,
      `shape ${i} stroke mismatch for "${name}".${hint}`,
    );
    for (const k of ["x", "y", "w", "h"]) {
      assert.ok(
        Math.abs(a[k] - e[k]) <= GEOM_TOL,
        `shape ${i} "${k}" for "${name}" is ${a[k]}, expected ~${e[k]} (>${GEOM_TOL}px drift).${hint}`,
      );
    }
  });
}

for (const [name, builderSrc] of charts) {
  it(`visual snapshot: ${name}`, async function () {
    const {chartScene, ...fp} = await render(body, fingerprintFn, builderSrc);
    assert.ok(chartScene > 0, `${name} emitted its marks into _chartScene`);
    assert.ok(fp.shapes.length > 0, `${name} rendered at least one shape`);
    await compare(name, fp);
  });
}
