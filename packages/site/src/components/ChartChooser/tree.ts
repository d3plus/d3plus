import type {Traits} from "./traits.js";
import {
  categoryUpTo,
  hasCategory,
  hasDate,
  hasGroups,
  hasSeries,
  hasValue,
  headline,
  nonNegative,
  numbersAtLeast,
  oneRowEach,
  q,
  rowsAtLeast,
  rowsAtMost,
  rule,
  total,
} from "./rules.js";
import type {Rule} from "./rules.js";

/**
 * A node of the decision tree: a branch asks something of the data's shape,
 * and a leaf is a chart. A node is lit when the data meets its rules and its
 * parent's.
 */
export interface TreeNode {
  id: string;
  label: string;
  /** A branch's question, shown when it is hovered. */
  hint?: string;
  /** A leaf's chart class. */
  chart?: string;
  rules: Rule[];
  children?: TreeNode[];
}

/** A chart leaf. */
const leaf = (chart: string, ...rules: Rule[]): TreeNode => ({
  id: chart,
  label: chart.replace(/([a-z])([A-Z])/g, "$1 $2"),
  chart,
  rules,
});

/** A branch. */
const branch = (
  id: string,
  label: string,
  hint: string,
  rules: Rule[],
  children: TreeNode[],
): TreeNode => ({id, label, hint, rules, children});

const geoAny = rule(
  "needs country codes (ISO3, like USA), US states, or latitude and longitude columns",
  t => {
    const {iso3, state, lat} = t.geo;
    if (iso3) return `${q(iso3)} holds country codes`;
    if (state) return `${q(state)} names US states`;
    return lat && `${q(lat)} and ${q(t.geo.lon!)} are coordinates`;
  },
);

/** How often dates of each kind fall. */
const ADVERB: Record<string, string> = {
  year: "yearly",
  quarter: "quarterly",
  month: "monthly",
  day: "daily",
  time: "timestamped",
};

const months = (t: Traits) =>
  t.date?.dateKind === "month" || t.date?.dateKind === "quarter";

/** The decision tree: data-shape questions, then the charts they lead to. */
export const TREE: TreeNode = branch(
  "root",
  "Your data",
  "Paste data or load a sample to see which charts it can draw.",
  [],
  [
    branch(
      "headline",
      "A few numbers",
      "One value, or a handful of headline metrics?",
      [headline],
      [
        leaf("KPI"),
        leaf(
          "Gauge",
          rule(
            t =>
              `needs 4 or fewer rows, one per needle (yours has ${t.rows.length})`,
            t =>
              t.rows.length <= 4 &&
              `${t.rows.length} needle${t.rows.length > 1 ? "s" : ""}`,
          ),
        ),
        leaf(
          "Bullet",
          rule("needs a target column (target, goal, budget…)", t =>
            t.target ? `${q(t.target)} is the target` : null,
          ),
        ),
      ],
    ),
    branch(
      "compare",
      "Categories + a value",
      "One number for each of several things?",
      [hasValue, hasCategory, oneRowEach],
      [
        branch(
          "part",
          "Part of a whole",
          "Do the values add up to a meaningful total?",
          [nonNegative],
          [
            leaf("Pie", categoryUpTo(12, "slices")),
            leaf("Donut", categoryUpTo(12, "slices")),
            leaf("Treemap"),
            leaf("Waffle", categoryUpTo(12)),
            leaf(
              "Parliament",
              rule(
                "needs whole-number counts totalling 1,000 or fewer (seats)",
                t =>
                  t.value?.integer && total(t, t.value) <= 1000
                    ? `${total(t, t.value)} seats`
                    : null,
              ),
              categoryUpTo(12, "parties"),
            ),
            leaf("PolarArea", categoryUpTo(12)),
            leaf("Funnel", categoryUpTo(12, "stages")),
          ],
        ),
        branch(
          "rank",
          "Ranking",
          "Which categories are biggest?",
          [],
          [
            leaf("BarChart", categoryUpTo(60, "bars")),
            leaf("Lollipop", categoryUpTo(60)),
            leaf("RadialBar", categoryUpTo(20, "bars")),
            leaf("Pareto", nonNegative, categoryUpTo(60, "bars")),
            leaf("Waterfall", categoryUpTo(30, "steps")),
            leaf(
              "WordCloud",
              rule(
                "needs 10 or more categories (words)",
                t => t.categories.some(c => c.unique >= 10) && "enough words",
              ),
            ),
          ],
        ),
      ],
    ),
    branch(
      "crosstab",
      "Category × category",
      "A value where two categories cross, like exporter × importer?",
      [
        hasValue,
        rule(
          "needs two categories that cross, one row for each pair",
          t => t.crossTab && `${q(t.crossTab[0])} × ${q(t.crossTab[1])}`,
        ),
      ],
      [
        leaf("Matrix"),
        leaf("BubbleMatrix"),
        leaf("RadialMatrix"),
        leaf("Marimekko", nonNegative),
        leaf(
          "Radar",
          rule("needs a category with 3–12 values for the spokes", t => {
            const spoke = t.crossTab?.find(
              c => c.unique >= 3 && c.unique <= 12,
            );
            return spoke && `${q(spoke)} as spokes`;
          }),
        ),
        leaf("Alluvial", nonNegative),
        leaf(
          "Pyramid",
          rule(
            "needs a category with exactly two values (e.g. male/female)",
            t => t.twoSided && `${q(t.twoSided.sides)} has two sides`,
          ),
        ),
      ],
    ),
    branch(
      "hierarchy",
      "Nested categories",
      "Categories inside categories, like region → country?",
      [
        rule(
          "needs 2 or more category columns that nest (each value inside exactly one parent)",
          t => t.hierarchy.length >= 2 && t.hierarchy.map(q).join(" → "),
        ),
      ],
      [
        leaf("Treemap", hasValue, nonNegative),
        leaf("Sunburst", hasValue, nonNegative),
        leaf("Icicle", hasValue, nonNegative),
        leaf("Pack", hasValue, nonNegative),
        leaf("Tree"),
        leaf("RadialTree"),
      ],
    ),
    branch(
      "time",
      "Change over time",
      "Does each row have a date?",
      [hasDate],
      [
        branch(
          "trend",
          "Trends",
          "A value measured at 3 or more dates?",
          [
            hasValue,
            rule(
              "needs 3 or more distinct dates",
              t => t.periods >= 3 && `${t.periods} dates`,
            ),
            rule(
              "needs one row per date (or per date and series)",
              t => t.keyed && "one row per date",
            ),
          ],
          [
            leaf("LinePlot"),
            leaf("AreaPlot"),
            leaf("StackedArea", hasSeries),
            leaf("Streamgraph", hasSeries),
            leaf("HorizonChart", hasSeries),
            leaf(
              "BumpChart",
              rule(
                "needs a category splitting the rows into 3 or more series",
                t =>
                  t.series &&
                  t.series.unique >= 3 &&
                  `${t.series.unique} series to rank`,
              ),
            ),
            leaf(
              "FanChart",
              rule(
                "needs lower and upper bound columns (lower/upper, p10/p90…)",
                t => t.bounds && `${q(t.bounds.lower)} to ${q(t.bounds.upper)}`,
              ),
            ),
          ],
        ),
        branch(
          "periods",
          "Before & after",
          "Exactly two dates to compare?",
          [
            rule(
              t => `needs exactly two distinct dates (yours has ${t.periods})`,
              t => t.periods === 2 && `two dates in ${q(t.date!)}`,
            ),
            hasValue,
            hasCategory,
          ],
          [leaf("SlopeChart"), leaf("Dumbbell")],
        ),
        branch(
          "cycles",
          "Cycles",
          "Dates finer than years, so seasons repeat?",
          [
            hasValue,
            rule(
              "needs dates finer than years (quarters, months, or days)",
              t =>
                t.date &&
                t.date.dateKind !== "year" &&
                `${ADVERB[t.date.dateKind!]} dates`,
            ),
          ],
          [
            leaf(
              "CyclePlot",
              rule(
                "needs monthly or quarterly dates covering 2 or more years",
                t =>
                  months(t) &&
                  t.years >= 1.9 &&
                  `${Math.round(t.years)} years of ${t.date!.dateKind}s`,
              ),
            ),
            leaf(
              "RadialLine",
              rule(
                "needs monthly dates (2024-03) covering a year or more",
                t =>
                  t.date?.dateKind === "month" &&
                  t.date.dateIso &&
                  t.years >= 0.9 &&
                  "a line per year",
              ),
            ),
            leaf(
              "RadialArea",
              rule(
                "needs monthly dates (2024-03) covering a year or more",
                t =>
                  t.date?.dateKind === "month" &&
                  t.date.dateIso &&
                  t.years >= 0.9 &&
                  "an area per year",
              ),
            ),
            leaf(
              "Calendar",
              rule(
                "needs daily dates covering 4 weeks or more",
                t =>
                  t.date?.dateKind === "day" &&
                  t.periods >= 28 &&
                  `${t.periods} days`,
              ),
            ),
          ],
        ),
        branch(
          "ohlc",
          "Prices (OHLC)",
          "Prices that open, peak, dip, and close each period?",
          [
            rule(
              "needs open, high, low, and close columns",
              t => t.ohlc && "open, high, low, and close",
            ),
          ],
          [leaf("Candlestick")],
        ),
        branch(
          "ranges",
          "Date ranges",
          "Does each row span from one date to another?",
          [
            rule(
              "needs start and end date columns",
              t => t.range && `${q(t.range.start)} to ${q(t.range.end)}`,
            ),
            hasCategory,
          ],
          [
            leaf(
              "Gantt",
              rule(
                "needs full dates, not just years",
                t => t.range?.start.dateKind !== "year" && "full dates",
              ),
            ),
            leaf("Priestley"),
          ],
        ),
      ],
    ),
    branch(
      "relations",
      "Two+ measures",
      "Several numbers for each item, to relate to each other?",
      [numbersAtLeast(2), rowsAtLeast(5, "to compare")],
      [
        leaf("Scatter"),
        leaf("BubbleChart", numbersAtLeast(3)),
        leaf(
          "ConnectedScatter",
          rule(
            "needs a date to connect the points in order",
            t => t.date && `connected by ${q(t.date)}`,
          ),
        ),
        leaf("Hexbin", rowsAtLeast(50, "to bin")),
        leaf("ScatterMatrix", numbersAtLeast(3)),
        leaf("ParallelCoordinates", numbersAtLeast(3)),
      ],
    ),
    branch(
      "distribution",
      "Distributions",
      "Many observations of one measure, to see how they spread?",
      [
        hasValue,
        rowsAtLeast(30, "of observations"),
        rule(
          "needs observations, not a time series",
          t => !(t.keyed && t.date) && "observations, not a time series",
        ),
      ],
      [
        leaf("Histogram"),
        leaf("DensityPlot"),
        leaf("DotPlot", rowsAtMost(300)),
        leaf("Beeswarm", rowsAtMost(500)),
        leaf("StripPlot", hasGroups),
        leaf("BoxWhisker", hasGroups),
        leaf("Violin", hasGroups),
        leaf("Ridgeline", hasGroups),
      ],
    ),
    branch(
      "flows",
      "Connections",
      "Does each row link one thing to another?",
      [
        rule(
          "needs source and target columns (or two columns naming the same things)",
          t => t.flows && `${q(t.flows.source)} → ${q(t.flows.target)}`,
        ),
      ],
      [
        leaf("Network"),
        leaf("Sankey"),
        leaf(
          "Chord",
          rule(
            t =>
              `works best with 40 or fewer nodes (yours has ${t.flows?.nodes})`,
            t => t.flows && t.flows.nodes <= 40 && `${t.flows.nodes} nodes`,
          ),
        ),
        leaf("ArcDiagram"),
        leaf("Rings"),
      ],
    ),
    branch(
      "sets",
      "Overlapping sets",
      "Groups and their overlaps, like A, B, and A & B?",
      [
        rule(
          "needs a column of sets and overlaps (A, B, A & B…)",
          t => t.sets && `${q(t.sets)} names sets`,
        ),
        hasValue,
      ],
      [leaf("Venn")],
    ),
    branch(
      "geo",
      "Places",
      "Does each row name a place?",
      [geoAny],
      [
        leaf("Geomap"),
        leaf(
          "TileGridMap",
          rule(
            "needs US states (names, postal codes, or FIPS codes)",
            t => t.geo.state && `${q(t.geo.state)} names states`,
          ),
        ),
      ],
    ),
  ],
);

/** A unique key for each node: its id, prefixed by its ancestors'. */
export const nodeKey = (path: string[]) => path.join("/");
