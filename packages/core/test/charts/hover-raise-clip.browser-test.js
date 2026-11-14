import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A hovered, active or highlighted mark paints in front of the other
    marks' labels and runs, also while a Plot wraps its marks in clip groups
    (a masked axis break, a domain that cuts data off), in Chromium on SVG
    and Canvas. The raised mark leaves its clip group for a raised copy of
    it, so the rest of the group stays under the labels. This checks the
    paint order: SVG's document order, and the order Canvas painted its
    pickable nodes in.
*/

const body =
  '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>';

/**
    Draws `chart` from `config` with no animation, resolving once painted.
    With `line`, the series of that id draws as a line and the rest as points.
    The config is copied into the page's own objects first: rows from the
    test's realm don't match the hover the way the page's own rows do.
*/
const draw = ([chart, config, renderer, line]) =>
  new Promise(resolve => {
    window.viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .config(JSON.parse(JSON.stringify(config)));
    if (line) window.viz.shape(d => (d.id === line ? "Line" : "Circle"));
    window.viz.render(() => resolve(true));
  });

/**
    Sets `state` ("hover", "active" or "highlight") to the rows whose
    `field` is `value`, then reports the paint order of every painted node
    (hit areas aside) as `{key, type}`, back to front.
*/
const interact = ([state, field, value]) =>
  new Promise(resolve => {
    const viz = window.viz;
    viz[state](d => d[field] === value);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const nodes =
          viz._renderer === "canvas"
            ? viz._sceneRenderer._pickIndex.map(({node}) => ({
                key: String(node.key),
                type: node.type,
              }))
            : [...document.querySelectorAll("#viz svg [data-key]")]
                .filter(el => el.tagName !== "g")
                .map(el => ({
                  key: el.getAttribute("data-key"),
                  type: el.tagName === "path" ? "path" : el.tagName,
                }));
        resolve(nodes.filter(n => !n.key.endsWith("::hit")));
      }),
    );
  });

/** Draws, interacts, and returns the paint order. */
async function paintOrder(chart, config, renderer, interaction, line) {
  const {page, errors, close} = await openPage(body);
  try {
    await page.evaluate(draw, [chart, config, renderer, line]);
    const order = await page.evaluate(interact, interaction);
    assert.deepStrictEqual(errors, [], "no page errors");
    return order;
  } finally {
    await close();
  }
}

/** The last paint position of a node whose key ends with `suffix` and passes `test`. */
const position = (order, test) => {
  let at = -1;
  order.forEach((n, i) => {
    if (test(n)) at = i;
  });
  return at;
};
const first = (order, test) => order.findIndex(test);

const outlierBars = {
  data: [
    {region: "North", sales: 42},
    {region: "South", sales: 58},
    {region: "East", sales: 35},
    {region: "Online", sales: 960},
    {region: "West", sales: 51},
  ],
  groupBy: "region",
  x: "region",
  y: "sales",
  yBreak: [80, 900],
};

/** A bar's own key, and its label's. */
const bar = region => `${region}_${region}`;
const isBar = key => n => n.key.endsWith(bar(key)) && n.type === "rect";
const isLabelOf = key => n =>
  n.key.endsWith(`${bar(key)}_0`) && n.type === "text";
const regions = outlierBars.data.map(d => d.region);
const isOtherLabel = key => n =>
  regions.some(r => r !== key && isLabelOf(r)(n));

for (const renderer of ["svg", "canvas"])
  for (const state of ["hover", "active", "highlight"])
    it(`BarChart: a${state === "active" ? "n" : ""} ${state} bar paints over the other labels under a yBreak, on ${renderer}`, async () => {
      const order = await paintOrder("BarChart", outlierBars, renderer, [
        state,
        "region",
        "South",
      ]);
      const raised = position(order, isBar("South"));
      assert.ok(raised >= 0, `the bar is painted: ${order.map(n => n.key)}`);
      assert.ok(
        order.filter(isOtherLabel("South")).length >= 4,
        "the other bars' labels are painted",
      );
      assert.ok(
        raised > position(order, isOtherLabel("South")),
        `the ${state} bar paints over every other label: ${order.map(n => n.key)}`,
      );
      // Its own label still sits on top of it, and the other bars stay
      // under their labels.
      assert.ok(position(order, isLabelOf("South")) > raised);
      assert.ok(
        position(order, isBar("North")) < first(order, isOtherLabel("South")),
        "the other bars stay under the labels",
      );
    });

// A line (A) that dips below the y domain, so it is clipped, and points
// (B0–B6) that it leaves whole (see `draw`).
const values = [1000, 1012, 995, 940, 900, 990, 1024];
const mixed = {
  data: values.flatMap((v, x) => [
    {id: "A", x, y: v},
    {id: `B${x}`, x, y: 1990 - v},
  ]),
  groupBy: "id",
  x: "x",
  y: "y",
  yDomain: [980],
};

for (const renderer of ["svg", "canvas"])
  it(`LinePlot: a hovered line cut off by the domain paints over the points, on ${renderer}`, async () => {
    const order = await paintOrder(
      "LinePlot",
      mixed,
      renderer,
      ["hover", "id", "A"],
      "A",
    );
    const line = position(order, n => n.key === "A" && n.type === "path");
    const circles = order.filter(n => n.type === "circle");
    assert.ok(
      line >= 0,
      `the line is painted: ${order.map(n => `${n.type}:${n.key}`)}`,
    );
    assert.ok(circles.length >= values.length, "the points are painted");
    assert.ok(
      line > position(order, n => n.type === "circle"),
      `the line paints over every point: ${order.map(n => n.key)}`,
    );
  });

for (const renderer of ["svg", "canvas"])
  it(`BarChart facets: a hovered bar paints over its panel's other labels under a yBreak, on ${renderer}`, async () => {
    const data = ["Left", "Right"].flatMap(panel =>
      outlierBars.data.map(d => ({...d, panel})),
    );
    const order = await paintOrder(
      "BarChart",
      {...outlierBars, data, facet: "panel"},
      renderer,
      ["hover", "region", "South"],
    );
    for (const panel of ["Left", "Right"]) {
      const own = order.filter(n => n.key.includes(panel));
      const raised = position(own, isBar("South"));
      assert.ok(raised >= 0, `${panel}: the bar is painted`);
      assert.ok(own.filter(isOtherLabel("South")).length >= 4);
      assert.ok(
        raised > position(own, isOtherLabel("South")),
        `${panel}: the bar paints over the other labels: ${own.map(n => n.key)}`,
      );
    }
  });
