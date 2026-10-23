import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";
import {captureWarnings} from "~test/helpers.js";

/**
    BoxWhisker boxes drawn from summary rows (`boxMin`, `boxQ1`, `boxMedian`,
    `boxQ3`, `boxMax`, `boxOutliers`) land exactly where the same boxes
    computed from raw observations do, vertical and horizontal, on SVG and
    Canvas; the value axis spans the statistics and outliers, the tooltip
    lists them, a partial set warns, and the raw path is untouched.
*/

// Observations, and the Tukey statistics d3plus computes from them.
const observations = {
  alpha: [300, 150, 160, 140, 20, 180, 40, 170, 125, 74, 80, 900],
  beta: [180, 30, 120, 50, 140, 115],
  gamma: [95, 110, 120, 135, 150, 160, 175, 210, 230, -60],
};
const summary = [
  {id: "alpha", min: 20, q1: 78.5, med: 145, q3: 172.5, max: 313.5, out: [900]},
  {id: "beta", min: 30, q1: 66.25, med: 117.5, q3: 135, max: 180, out: []},
  {
    id: "gamma",
    min: 24.375,
    q1: 112.5,
    med: 142.5,
    q3: 171.25,
    max: 230,
    out: [-60],
  },
];

// Runs in the page: draws a BoxWhisker from `rows` (summary rows when
// `stats`, observations otherwise) and reports each box part's geometry, the
// value axis's domain, the category tick labels, and any NaN attributes.
const draw = async ({rows, stats, horizontal, renderer, config}) => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const viz = new window.d3plus.BoxWhisker()
    .select(el)
    .renderer(renderer || "svg")
    .detectVisible(false)
    .duration(0)
    .width(600)
    .height(400)
    .data(rows)
    .legend(false)
    .yConfig({title: false})
    .xConfig({title: false});
  if (stats)
    viz
      .boxMin("min")
      .boxQ1("q1")
      .boxMedian("med")
      .boxQ3("q3")
      .boxMax("max")
      .boxOutliers("out");
  else viz.groupBy(["id", "n"]);
  if (horizontal) {
    viz
      .discrete("y")
      .y("id")
      .shapeConfig({Box: {orient: "horizontal"}});
    if (!stats) viz.x("value");
  } else {
    viz.x("id");
    if (!stats) viz.y("value");
  }
  if (config) viz.config(config);
  await new Promise(r => viz.render(r));

  const parts = {};
  const outliers = [];
  const walk = list => {
    for (const n of list || []) {
      if (n.type === "group") walk(n.children);
      else if (typeof n.key === "string" && !n.key.endsWith("::hit")) {
        const t = n.transform || {};
        const at = [t.x ?? n.x, t.y ?? n.y, n.width, n.height].map(v =>
          v === undefined ? null : Math.round(v * 100) / 100,
        );
        const m = n.key.match(/(alpha|beta|gamma)-(.*)$/);
        if (!m) continue;
        if (m[2].startsWith("outlier"))
          outliers.push(`${m[1]}:${at.slice(0, 2).join(",")}`);
        else parts[`${m[1]}-${m[2]}`] = at;
      }
    }
  };
  walk(viz._chartScene);
  const valueAxis = horizontal ? viz._xAxis : viz._yAxis;
  const labels = [...el.querySelectorAll("text")].map(t => t.textContent);
  const nan = [...el.querySelectorAll("*")].filter(n =>
    [...n.attributes].some(a => a.value.includes("NaN")),
  ).length;
  el.remove();
  return {
    parts,
    outliers: outliers.sort(),
    domain: valueAxis.domain().map(v => Math.round(v * 1000) / 1000),
    labels: labels.filter(l => /^(alpha|beta|gamma)$/.test(l)).sort(),
    nan,
  };
};

const raw = Object.entries(observations).flatMap(([id, values]) =>
  values.map((value, n) => ({id, n, value})),
);

for (const horizontal of [false, true]) {
  const name = horizontal ? "horizontal" : "vertical";
  it(`BoxWhisker precomputed (${name}): boxes land where the raw path's do, on SVG and Canvas`, async function () {
    const out = await render("", async () => ({
      raw: await draw({rows: raw, horizontal}),
      svg: await draw({rows: summary, stats: true, horizontal}),
      canvas: await draw({
        rows: summary,
        stats: true,
        horizontal,
        renderer: "canvas",
      }),
    }));
    assert.ok(Object.keys(out.raw.parts).length >= 12, "raw parts drawn");
    assert.deepStrictEqual(out.svg.parts, out.raw.parts, "same box geometry");
    assert.deepStrictEqual(out.svg.outliers, out.raw.outliers, "same outliers");
    assert.strictEqual(out.svg.outliers.length, 2, "both outliers drawn");
    assert.deepStrictEqual(out.svg.domain, out.raw.domain, "same value axis");
    assert.deepStrictEqual(out.svg.labels, ["alpha", "beta", "gamma"]);
    assert.strictEqual(out.svg.nan, 0, "no NaN attributes");
    assert.deepStrictEqual(out.canvas.parts, out.svg.parts, "canvas geometry");
    assert.deepStrictEqual(out.canvas.outliers, out.svg.outliers);
  });
}

it("BoxWhisker precomputed: the value axis spans every statistic and outlier", async function () {
  const rows = [
    {
      id: "alpha",
      min: -40,
      q1: 10,
      med: 20,
      q3: 30,
      max: 60,
      out: [2000, -500],
    },
    {id: "beta", min: 5, q1: 15, med: 25, q3: 35, max: 3000, out: []},
  ];
  const out = await render("", () => draw({rows, stats: true}));
  const [hi, lo] = out.domain;
  assert.ok(lo <= -500 && hi >= 3000, `domain ${out.domain}`);
  assert.strictEqual(out.outliers.length, 2, "both outliers drawn");
});

it("BoxWhisker precomputed: a partial set of statistics warns and draws no box", async function () {
  let out;
  const warnings = await captureWarnings(async () => {
    out = await render("", () =>
      draw({
        rows: summary,
        config: {boxMin: "min", boxMedian: "med", x: "id"},
      }),
    );
  });
  assert.ok(
    warnings.includes(
      "Box draws precomputed boxes only when boxMin, boxQ1, boxMedian, boxQ3, boxMax are all set; missing boxQ1, boxQ3, boxMax.",
    ),
    `warned: ${JSON.stringify(warnings)}`,
  );
  assert.deepStrictEqual(out.parts, {});
  assert.strictEqual(out.nan, 0, "no NaN attributes");
});

it("BoxWhisker: the raw path ignores unset statistics", async function () {
  const out = await render("", async () => ({
    plain: await draw({rows: raw}),
    unset: await draw({
      rows: raw,
      config: {boxMin: null, boxMedian: false, boxOutliers: undefined},
    }),
  }));
  assert.deepStrictEqual(out.unset, out.plain);
  assert.strictEqual(out.plain.outliers.length, 2);
});

it("BoxWhisker precomputed: color, legend, hover, highlight, and facets", async function () {
  const out = await render("", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const rows = summary.flatMap(r => [
      {...r, panel: "one"},
      {...r, panel: "two", out: r.id === "alpha" ? [1500] : r.out},
    ]);
    const viz = new window.d3plus.BoxWhisker()
      .select(el)
      .detectVisible(false)
      .duration(0)
      .width(800)
      .height(400)
      .data(rows)
      .groupBy(["id"])
      .facet("panel")
      .x("id")
      .boxMin("min")
      .boxQ1("q1")
      .boxMedian("med")
      .boxQ3("q3")
      .boxMax("max")
      .boxOutliers("out");
    await new Promise(r => viz.render(r));
    const nodes = {};
    const walk = list => {
      for (const n of list || []) {
        if (n.type === "group") walk(n.children);
        else if (typeof n.key === "string") nodes[n.key] = n;
      }
    };
    walk(viz._chartScene);
    const legend = {};
    const swatches = list => {
      for (const n of list || []) {
        if (n.type === "group") swatches(n.children);
        else if (n.type === "rect" && /_1_$/.test(n.key))
          legend[n.key.replace(/_1_$/, "")] = n.paint?.fill;
      }
    };
    swatches([viz._legendClass.toScene()]);
    const frames = async () => {
      for (let i = 0; i < 3; i++)
        await new Promise(r => requestAnimationFrame(() => r()));
    };
    const opacity = key => {
      let o = 1;
      const dom = el.querySelector(`[data-key='${key}']`);
      for (let n = dom; n && n !== el; n = n.parentNode)
        o *= Number(n.getAttribute("opacity") ?? 1);
      return o;
    };
    viz.hover(d => d.id === "alpha");
    await frames();
    const hovered = {
      alpha: opacity("facet-one/alpha-box"),
      beta: opacity("facet-one/beta-box"),
    };
    viz.hover(false);
    viz.highlight(d => d.id === "beta");
    await frames();
    const fillOf = key =>
      el.querySelector(`[data-key='${key}']`)?.getAttribute("fill");
    const highlighted = {
      alpha: fillOf("facet-two/alpha-box"),
      beta: fillOf("facet-two/beta-box"),
    };
    const y = key => nodes[key]?.transform?.y;
    el.remove();
    return {
      keys: Object.keys(nodes).filter(k => /-(box|outlier-\d)$/.test(k)),
      fills: Object.fromEntries(
        ["alpha", "beta", "gamma"].map(id => [
          id,
          [
            nodes[`facet-one/${id}-box`]?.paint?.fill,
            nodes[`facet-two/${id}-box`]?.paint?.fill,
          ],
        ]),
      ),
      outlierFill: nodes["facet-one/alpha-outlier-0"]?.paint?.fill,
      legend,
      hovered,
      highlighted,
      outliers: [
        y("facet-one/alpha-outlier-0"),
        y("facet-two/alpha-outlier-0"),
      ],
      boxes: [y("facet-one/alpha-box"), y("facet-two/alpha-box")],
    };
  });
  for (const id of ["alpha", "beta", "gamma"]) {
    const [one, two] = out.fills[id];
    assert.ok(one && one !== "white", `${id} filled`);
    assert.strictEqual(one, two, `${id} matches across panels`);
    assert.strictEqual(out.legend[id], one, `${id} swatch matches`);
  }
  assert.strictEqual(out.outlierFill, out.fills.alpha[0]);
  assert.ok(out.hovered.alpha > out.hovered.beta, "hover dims other boxes");
  assert.strictEqual(
    out.highlighted.beta,
    out.fills.beta[1],
    "beta keeps its fill",
  );
  assert.notStrictEqual(
    out.highlighted.alpha,
    out.fills.alpha[1],
    "alpha grays",
  );
  // The panels share one value axis, which reaches the 1500 outlier.
  assert.strictEqual(out.boxes[0], out.boxes[1], "shared value axis");
  assert.ok(out.outliers[1] < out.outliers[0], "1500 sits above 900");
  assert.strictEqual(out.keys.length, 3 * 2 + 2 * 2, out.keys.join());
});

/** Hovers the alpha box on a real page and reads the tooltip. */
async function hoverTooltip(renderer, at) {
  const {page, close} = await openPage(
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>',
  );
  try {
    const center = await page.evaluate(
      ([summary, renderer]) =>
        new Promise(resolve => {
          const viz = new window.d3plus.BoxWhisker()
            .data(summary)
            .x("id")
            .boxMin("min")
            .boxQ1("q1")
            .boxMedian("med")
            .boxQ3("q3")
            .boxMax("max")
            .boxOutliers("out")
            .renderer(renderer)
            .duration(0)
            .select("#viz");
          viz.render(() => {
            const r = document
              .querySelector("#viz [data-key$='alpha-box']")
              ?.getBoundingClientRect();
            resolve(r ? [r.left + r.width / 2, r.top + r.height / 2] : null);
          });
        }),
      [summary, renderer],
    );
    const [x, y] = at || center;
    await page.mouse.move(5, 5);
    await page.mouse.move(x, y);
    await page.waitForTimeout(100);
    const text = await page.evaluate(() => {
      const t = document.querySelector(".d3plus-tooltip");
      return t ? t.textContent : null;
    });
    return {center, text};
  } finally {
    await close();
  }
}

it(
  "BoxWhisker precomputed: the tooltip lists the given statistics (SVG and Canvas)",
  {timeout: 60000},
  async function () {
    const svg = await hoverTooltip("svg");
    assert.ok(svg.center, "alpha box drawn");
    const canvas = await hoverTooltip("canvas", svg.center);
    for (const {text} of [svg, canvas]) {
      assert.ok(text, "tooltip opens");
      for (const part of [
        "alpha",
        "Maximum",
        "314",
        "Upper Quartile",
        "173",
        "Median",
        "145",
        "Lower Quartile",
        "78.5",
        "Minimum",
        "20",
      ])
        assert.ok(text.includes(part), `tooltip has ${part}: ${text}`);
    }
  },
);
