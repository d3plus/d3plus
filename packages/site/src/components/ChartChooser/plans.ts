import type {Column} from "./columns.js";
import {codeSource, niceMax, prop, str, strList} from "./code.js";
import type {Field, Plan} from "./code.js";
import {geomapPlan, tileGridPlan} from "./places.js";
import type {Traits} from "./traits.js";
import {pickCategory} from "./traits.js";

/** A column's key as source. */
const k = (c: Column) => str(c.key);

/** The data's measure; plans run only for charts whose rules found one. */
const v = (t: Traits) => t.value!;

/** The category a chart of at most `max` marks labels them by. */
const cat = (t: Traits, max = Infinity) =>
  (pickCategory(t, max) ?? pickCategory(t))!;

/**
 * How a chart of one mark per row groups its marks: by the category naming
 * each row (nested in its parents, colored by the outermost), else by row,
 * colored by a category of a few values when there is one.
 */
export function itemGroups(t: Traits): string {
  const item = t.item;
  const chain = t.hierarchy;
  if (item)
    return chain.length && chain[chain.length - 1] === item
      ? strList(chain.map(c => c.key))
      : k(item);
  const group = t.groups ?? pickCategory(t, 12);
  return group ? `[${k(group)}, (d, i) => i]` : "(d, i) => i";
}

/**
 * For points grouped by row, with no category naming them: tooltips named
 * by the points' group, and no labels on the points themselves.
 */
export function unnamed(t: Traits): Field[] {
  if (t.item) return [];
  const group = t.groups ?? pickCategory(t, 12);
  return [
    ...(group ? ([["label", `d => ${prop(group.key)}`]] as Field[]) : []),
    ["shapeConfig", "{label: false}"],
  ];
}

/**
 * The measures a chart of several plots in order: the data's own order,
 * except prices put close and volume first (not open against high).
 */
export function measureOrder(t: Traits): Column[] {
  const volume = t.numbers.find(c => /^volume$/i.test(c.key));
  const first = t.ohlc ? [t.ohlc.close, ...(volume ? [volume] : [])] : [];
  return [...first, ...t.numbers.filter(c => !first.includes(c))];
}

/** `groupBy` when the data has something to group by. */
const groupBy = (code: string | undefined): Field[] =>
  code ? [["groupBy", code]] : [];

/** The date column every time chart reads. */
const d = (t: Traits) => t.date!;

/** Whether d3plus needs `time` to read a date column as dates. */
const timeFields = (t: Traits): Field[] =>
  d(t).dateKind === "year"
    ? []
    : [
        ["time", k(d(t))],
        ["timeline", "false"],
      ];

/** Charts of one number per category. */
const categoryValue =
  (max: number, key: "value" | "sum" | "size") =>
  (t: Traits): Plan => ({
    fields: [
      ["data", "data"],
      ["groupBy", k(cat(t, max))],
      [key, k(v(t))],
    ],
  });

/** Charts of bars along a category axis. */
const bars =
  (max: number) =>
  (t: Traits): Plan => ({
    fields: [
      ["data", "data"],
      ["groupBy", k(cat(t, max))],
      ["x", k(cat(t, max))],
      ["y", k(v(t))],
    ],
  });

/** Charts of the cells where two categories cross. */
const crossCells =
  (measure: "colorScale" | "size") =>
  (t: Traits): Plan => {
    const [row, column] = t.crossTab!;
    return {
      fields: [
        ["data", "data"],
        ["groupBy", strList([row.key, column.key])],
        ["row", k(row)],
        ["column", k(column)],
        [measure, k(v(t))],
      ],
    };
  };

/** Charts of a nested hierarchy, sized by the value when there is one. */
const nested =
  (measure?: "sum") =>
  (t: Traits): Plan => ({
    fields: [
      ["data", "data"],
      ["groupBy", strList(t.hierarchy.map(c => c.key))],
      ...(measure ? [[measure, k(v(t))] as Field] : []),
    ],
  });

/** Charts of a value over time, a line or area per series. */
const overTime = (t: Traits): Plan => ({
  fields: [
    ["data", "data"],
    // A line per series, or a single line named by its measure.
    ["groupBy", t.series ? k(t.series) : `() => ${k(v(t))}`],
    ["x", k(d(t))],
    ["y", k(v(t))],
    ...timeFields(t),
  ],
});

/** Radial charts of monthly dates: a line per year around the months. */
const aroundTheYear = (t: Traits): Plan => {
  const date = prop(d(t).key);
  return {
    prelude: [
      `const months = ${strList(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])};`,
    ],
    fields: [
      ["data", "data"],
      ["groupBy", `d => ${date}.slice(0, 4)`],
      ["x", `d => months[${date}.slice(5, 7) - 1]`],
      ["y", k(v(t))],
    ],
  };
};

/** Charts of each row's own value, one mark per row. */
const perRow = (t: Traits): Field[] => [
  ["groupBy", t.item ? k(t.item) : "(d, i) => i"],
];

/** Distribution charts of one measure, per group when there are groups. */
const spread =
  (key: "value" | "x") =>
  (t: Traits): Plan => ({
    fields: [
      ["data", "data"],
      ...groupBy(t.groups && k(t.groups)),
      [key, k(v(t))],
    ],
  });

/** Distribution charts of one mark per row, laned by group. */
const laned = (t: Traits): Plan => {
  const g = t.groups!;
  return {
    fields: [
      ["data", "data"],
      ...perRow(t),
      ["color", k(g)],
      ["x", k(g)],
      ["y", k(v(t))],
      ["legend", "false"],
      ...unnamed(t),
    ],
  };
};

/**
 * One mark per row along a value axis: colored by group when there are
 * groups (one legend entry each), else with no legend, which would list
 * every row.
 */
const rowMarks = (t: Traits, lanes: boolean): Plan => ({
  fields: [
    ["data", "data"],
    ...perRow(t),
    ["x", k(v(t))],
    ...(t.groups
      ? ([
          ...(lanes ? [["y", k(t.groups)]] : []),
          ["color", k(t.groups)],
        ] as Field[])
      : ([["legend", "false"]] as Field[])),
    ...unnamed(t),
  ],
});

/** Charts of two or more measures per item. */
const measures =
  (extra: (t: Traits) => Field[] = () => []) =>
  (t: Traits): Plan => ({
    fields: [
      ["data", "data"],
      ["groupBy", itemGroups(t)],
      ["x", k(measureOrder(t)[0])],
      ["y", k(measureOrder(t)[1])],
      ...extra(t),
      ...unnamed(t),
    ],
  });

/** Charts of every measure at once. */
const dimensions = (t: Traits): Plan => ({
  fields: [
    ["data", "data"],
    ["groupBy", itemGroups(t)],
    ["dimensions", strList(t.numbers.slice(0, 5).map(c => c.key))],
  ],
});

/**
 * Node-link charts (Network, ArcDiagram, Rings), whose links name their ends
 * `source` and `target`: the rows as links, renamed when their ends are
 * named otherwise, each as wide as its value.
 */
const nodeLinks = (t: Traits): Plan => {
  const {source, target} = t.flows!;
  const plain = source.key === "source" && target.key === "target";
  return {
    prelude: plain
      ? []
      : [
          `const links = data.map(d => ({...d, source: ${prop(source.key)}, target: ${prop(target.key)}}));`,
        ],
    fields: [
      ["links", plain ? "data" : "links"],
      ...(t.value
        ? ([["linkSize", `d => ${prop(t.value.key)}`]] as Field[])
        : []),
    ],
  };
};

/**
 * Flow charts (Sankey, Chord), which read each link's ends and value from
 * the keys they are told.
 */
const flowLinks = (t: Traits): Plan => {
  const {source, target} = t.flows!;
  const plain = source.key === "source" && target.key === "target";
  return {
    fields: [
      ["links", "data"],
      ...(plain
        ? []
        : ([
            ["linksSource", k(source)],
            ["linksTarget", k(target)],
          ] as Field[])),
      ...(t.value ? ([["value", k(t.value)]] as Field[]) : []),
    ],
  };
};

/** The generated config of every chart, from the data's traits. */
export const PLANS: Record<string, (t: Traits) => Plan> = {
  KPI: t => {
    const name = t.date ? t.series : (pickCategory(t) ?? t.categories[0]);
    return {
      fields: [
        ["data", "data"],
        // Each tile is titled by its group, or by the value's name.
        name ? ["groupBy", k(name)] : ["label", `() => ${k(v(t))}`],
        ["value", k(v(t))],
        ...(t.date ? ([["time", k(d(t))]] as Field[]) : []),
      ],
    };
  },
  Gauge: t => ({
    fields: [
      ["data", "data"],
      ...groupBy(t.categories[0] && k(t.categories[0])),
      ["value", k(v(t))],
      [
        "domain",
        `[0, ${niceMax(Math.max(v(t).max ?? 0, t.target?.max ?? 0))}]`,
      ],
    ],
  }),
  Bullet: t => ({
    fields: [
      ["data", "data"],
      ...groupBy(t.categories[0] && k(t.categories[0])),
      ["value", k(v(t))],
      ["target", k(t.target!)],
    ],
  }),
  Pie: categoryValue(12, "value"),
  Donut: categoryValue(12, "value"),
  Treemap: t =>
    t.hierarchy.length ? nested("sum")(t) : categoryValue(Infinity, "sum")(t),
  Waffle: categoryValue(12, "sum"),
  Parliament: categoryValue(12, "sum"),
  PolarArea: categoryValue(12, "value"),
  Funnel: categoryValue(12, "value"),
  BarChart: bars(50),
  Lollipop: bars(50),
  RadialBar: categoryValue(20, "value"),
  Pareto: bars(50),
  Waterfall: t => ({
    fields: [
      ["data", "data"],
      ["x", k(cat(t, 30))],
      ["y", k(v(t))],
    ],
  }),
  WordCloud: categoryValue(Infinity, "size"),
  Matrix: crossCells("colorScale"),
  BubbleMatrix: crossCells("size"),
  RadialMatrix: crossCells("colorScale"),
  Marimekko: t => {
    const [a, b] = t.crossTab!;
    return {
      fields: [
        ["data", "data"],
        ["groupBy", k(b)],
        ["x", k(a)],
        ["y", k(v(t))],
      ],
    };
  },
  Radar: t => {
    const pair = t.crossTab!;
    const spoke = pair.find(c => c.unique >= 3 && c.unique <= 12)!;
    const series = pair.find(c => c !== spoke)!;
    return {
      fields: [
        ["data", "data"],
        ["groupBy", k(series)],
        ["metric", k(spoke)],
        ["value", k(v(t))],
      ],
    };
  },
  Alluvial: t => ({
    fields: [
      ["data", "data"],
      ["dimensions", strList(t.crossTab!.map(c => c.key))],
      ["value", k(v(t))],
    ],
  }),
  Pyramid: t => ({
    fields: [
      ["data", "data"],
      ["groupBy", k(t.twoSided!.sides)],
      ["x", k(v(t))],
      ["y", k(t.twoSided!.category)],
    ],
  }),
  Sunburst: nested("sum"),
  Icicle: nested("sum"),
  Pack: nested("sum"),
  Tree: nested(),
  RadialTree: nested(),
  LinePlot: overTime,
  AreaPlot: overTime,
  StackedArea: overTime,
  Streamgraph: overTime,
  HorizonChart: overTime,
  BumpChart: t => {
    const [date, series, value] = [d(t).key, t.series!.key, v(t).key];
    return {
      prelude: [
        `// A bump chart plots ranks: number each date's ${series} values, 1 for the highest.`,
        `const ranked = data.map(d => ({\n  ...d,\n  rank: 1 + data.filter(e => e${prop(date).slice(1)} === ${prop(date)} && e${prop(value).slice(1)} > ${prop(value)}).length,\n}));`,
      ],
      fields: [
        ["data", "ranked"],
        ["groupBy", str(series)],
        ["x", str(date)],
        ["y", str("rank")],
        ["discrete", str("x")],
      ],
    };
  },
  FanChart: t => ({
    fields: [
      ...overTime(t).fields,
      ["confidence", strList([t.bounds!.lower.key, t.bounds!.upper.key])],
      ["legend", "false"],
    ],
  }),
  SlopeChart: t => ({
    fields: [
      ["data", "data"],
      ["groupBy", k(cat(t))],
      ["x", k(d(t))],
      ["y", k(v(t))],
    ],
  }),
  Dumbbell: t => ({
    fields: [
      ["data", "data"],
      ["groupBy", k(d(t))],
      ["x", k(v(t))],
      ["y", k(cat(t))],
    ],
  }),
  CyclePlot: t => ({
    fields: [
      ["data", "data"],
      ...groupBy(t.series && k(t.series)),
      ["x", k(d(t))],
      ["y", k(v(t))],
      ...(d(t).dateKind === "quarter"
        ? ([["period", str("quarter")]] as Field[])
        : []),
    ],
  }),
  RadialLine: aroundTheYear,
  RadialArea: aroundTheYear,
  Calendar: t => ({
    fields: [
      ["data", "data"],
      ["date", k(d(t))],
      ["colorScale", k(v(t))],
      // Under half a year of days reads better as a grid per month.
      ...(t.years < 0.5 ? ([["period", str("month")]] as Field[]) : []),
    ],
  }),
  Candlestick: t => {
    const {open, high, low, close} = t.ohlc!;
    const named: Field[] = [
      ["date", d(t)],
      ["open", open],
      ["high", high],
      ["low", low],
      ["close", close],
    ]
      .filter(([key, col]) => (col as Column).key !== key)
      .map(([key, col]) => [key as string, k(col as Column)]);
    const volume = t.numbers.find(c => /^volume$/i.test(c.key));
    return {
      fields: [
        ["data", "data"],
        ...groupBy(t.categories[0] && k(t.categories[0])),
        ...named,
        ...(volume ? ([["volume", k(volume)]] as Field[]) : []),
      ],
    };
  },
  Gantt: t => {
    const task = cat(t);
    const chain = t.hierarchy;
    // Tasks nested in phases group under them.
    const phase =
      chain[chain.length - 1] === task ? chain[chain.length - 2] : undefined;
    return {
      fields: [
        ["data", "data"],
        ["groupBy", k(task)],
        ["start", k(t.range!.start)],
        ["end", k(t.range!.end)],
        ...(phase ? ([["group", k(phase)]] as Field[]) : []),
      ],
    };
  },
  Priestley: t => ({
    fields: [
      ["data", "data"],
      ["groupBy", k(cat(t))],
      ["start", k(t.range!.start)],
      ["end", k(t.range!.end)],
    ],
  }),
  Scatter: measures(),
  BubbleChart: measures(t => [["size", k(measureOrder(t)[2])]]),
  ConnectedScatter: t => ({
    fields: [
      ["data", "data"],
      // One path per series, or a single path named by its measure.
      ["groupBy", t.series ? k(t.series) : `() => ${k(measureOrder(t)[1])}`],
      ["order", k(d(t))],
      ["x", k(measureOrder(t)[0])],
      ["y", k(measureOrder(t)[1])],
    ],
  }),
  Hexbin: t => ({
    fields: [
      ["data", "data"],
      ["x", k(measureOrder(t)[0])],
      ["y", k(measureOrder(t)[1])],
    ],
  }),
  ScatterMatrix: t => ({
    fields: [
      ["data", "data"],
      ...groupBy(t.groups && k(t.groups)),
      ["dimensions", strList(t.numbers.slice(0, 4).map(c => c.key))],
    ],
  }),
  ParallelCoordinates: dimensions,
  Histogram: spread("value"),
  DensityPlot: spread("value"),
  DotPlot: t => rowMarks(t, false),
  Beeswarm: t => rowMarks(t, true),
  StripPlot: laned,
  BoxWhisker: laned,
  Violin: spread("value"),
  Ridgeline: spread("value"),
  Network: nodeLinks,
  Sankey: flowLinks,
  Chord: flowLinks,
  ArcDiagram: nodeLinks,
  Rings: t => {
    const plan = nodeLinks(t);
    return {...plan, fields: [...plan.fields, ["center", str(hub(t))]]};
  },
  Venn: t => {
    const sets = t.sets!;
    const delimiter = sets.setDelimiter;
    return {
      fields: [
        ["data", "data"],
        [
          "sets",
          delimiter
            ? `d => ${prop(sets.key)}.split(${str(delimiter)}).map(s => s.trim())`
            : k(sets),
        ],
        ["value", k(v(t))],
      ],
    };
  },
  Geomap: geomapPlan,
  TileGridMap: tileGridPlan,
};

/** The node with the most links: the center of a Rings chart. */
export function hub(t: Traits): string {
  const {source, target} = t.flows!;
  const degree = new Map<string, number>();
  for (const row of t.rows)
    for (const end of [source.key, target.key])
      if (end in row) {
        const id = String(row[end]);
        degree.set(id, (degree.get(id) ?? 0) + 1);
      }
  return [...degree].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

/** The playground code that draws a chart from a dataset. */
export function chartCode(chart: string, t: Traits): string {
  return codeSource(t.rows, PLANS[chart](t));
}
