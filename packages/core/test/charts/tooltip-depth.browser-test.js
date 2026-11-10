import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    #364: a `tooltip` accessor's third argument gives the hovered item's
    `groupBy` level (`depth`) and the deepest level (`maxDepth`), so
    `depth === maxDepth` keeps tooltips to the deepest level: on a chart that
    drills down, on one that draws several levels at once, and in the legend.
*/

const data = [
  {region: "West", state: "Oregon", value: 30},
  {region: "West", state: "Nevada", value: 25},
  {region: "West", state: "Utah", value: 18},
  {region: "South", state: "Texas", value: 40},
  {region: "South", state: "Georgia", value: 22},
  {region: "East", state: "Maine", value: 14},
  {region: "East", state: "Ohio", value: 28},
];

const body = `
  <div id="layout" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>
  <div id="viz" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** Opens a page with the helpers the tests drive charts through. */
async function open() {
  const opened = await openPage(body);
  await opened.page.evaluate(data => {
    window.TOOLTIPS = {
      deepest: (d, i, {depth, maxDepth}) => depth === maxDepth,
      west: d => d.region === "West",
      off: false,
      calls: (d, i, levels) => (window.__calls.push(levels), true),
    };
    // Draws `chart` into `sel`, in place of the chart last drawn in #viz;
    // `tooltip` names an entry of TOOLTIPS.
    window.make = (chart, config, renderer, sel = "#viz") =>
      new Promise(resolve => {
        const {tooltip, ...rest} = config;
        if (sel === "#viz" && window.__viz) window.__viz.destroy();
        const viz = new window.d3plus[chart]()
          .config({
            data,
            groupBy: ["region", "state"],
            sum: "value",
            legend: true,
            duration: 0,
            ...rest,
          })
          .renderer(renderer)
          .select(sel);
        if (tooltip) viz.tooltip(window.TOOLTIPS[tooltip]);
        if (sel === "#viz") {
          window.__viz = viz;
          window.__calls = [];
        }
        viz.render(() => resolve(viz));
      });
    // Client coordinates of the center of the chart shape keyed `key`.
    window.shapePoint = key => {
      const viz = window.__viz;
      let node;
      const walk = nodes =>
        nodes.forEach(n => {
          if (n.key === key) node = n;
          else if (n.children) walk(n.children);
        });
      walk(viz._chartScene);
      const surface = document
        .querySelector("#viz svg, #viz canvas")
        .getBoundingClientRect();
      const c = viz._chartTransform || {x: 0, y: 0};
      const [x, y] =
        node.type === "circle"
          ? [node.cx, node.cy]
          : [node.x + node.width / 2, node.y + node.height / 2];
      return [surface.left + c.x + x, surface.top + c.y + y];
    };
    // Client coordinates of the legend entry labelled `label`, read from the
    // same chart laid out in SVG, whose legend the canvas chart shares.
    window.legendPoint = async (chart, config, label) => {
      const twin = await window.make(chart, config, "svg", "#layout");
      const text = [
        ...document.querySelectorAll('#layout [data-key="viz-legend"] text'),
      ].find(t => t.textContent.trim() === label);
      const box = text.getBoundingClientRect();
      twin.destroy();
      return [box.left + box.width / 2, box.top + box.height / 2];
    };
    // The titles of the tooltips showing.
    window.shown = () =>
      [...document.querySelectorAll(".d3plus-tooltip")]
        .filter(t => getComputedStyle(t).visibility === "visible")
        .map(t => t.querySelector(".d3plus-tooltip-title").textContent.trim());
  }, data);
  return opened;
}

/** Moves the real pointer onto a point and returns the tooltips showing. */
async function hover(page, point) {
  await page.mouse.move(5, 395);
  await page.waitForTimeout(40);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(120);
  return page.evaluate(() => window.shown());
}

const shapePoint = (page, key) =>
  page.evaluate(key => window.shapePoint(key), key);

/**
    Moves the real pointer onto the legend entry labelled `label` of the chart
    in #viz, drawn with `config`, and returns the tooltips showing.
*/
async function hoverLegend(page, chart, config, label) {
  const point = await page.evaluate(
    ([chart, config, label]) => window.legendPoint(chart, config, label),
    [chart, config, label],
  );
  const titles = await hover(page, point);
  const entry = await page.evaluate(() => {
    const pick = window.__viz._lastScenePick;
    return Boolean(pick && pick.isLegend);
  });
  assert.strictEqual(entry, true, `the pointer is on the "${label}" entry`);
  return titles;
}

const draw = (page, chart, config, renderer) =>
  page.evaluate(
    ([chart, config, renderer]) =>
      window.make(chart, config, renderer).then(() => null),
    [chart, config, renderer],
  );

for (const renderer of ["svg", "canvas"]) {
  it(`tooltip depth (${renderer}): a drill-down Treemap shows tooltips only once drilled in`, async () => {
    const {page, close} = await open();
    const config = {depth: 0, color: "state", tooltip: "deepest"};
    try {
      await draw(page, "Treemap", config, renderer);
      const west = await shapePoint(page, "treemap-West");
      assert.deepStrictEqual(await hover(page, west), [], "a region tile");
      assert.deepStrictEqual(
        await hoverLegend(page, "Treemap", config, "West"),
        [],
        "a region's legend entry",
      );

      await page.mouse.click(west[0], west[1]);
      await page.waitForTimeout(150);
      const state = await page.evaluate(() => ({
        depth: window.__viz._drawDepth,
        history: window.__viz._history.length,
      }));
      assert.deepStrictEqual(state, {depth: 1, history: 1}, "drilled in");

      assert.deepStrictEqual(
        await hover(page, await shapePoint(page, "treemap-Oregon")),
        ["Oregon"],
        "a state tile",
      );
      // The drilled-in chart's legend, laid out without the click.
      const drilled = {...config, depth: 1, data: data.slice(0, 3)};
      assert.deepStrictEqual(
        await hoverLegend(page, "Treemap", drilled, "Utah"),
        ["Utah"],
        "a state's legend entry",
      );
      assert.deepStrictEqual(
        await hover(page, await shapePoint(page, "treemap-group-West")),
        [],
        "the region's header strip above its states",
      );
    } finally {
      await close();
    }
  });

  it(`tooltip depth (${renderer}): an Icicle shows tooltips only on its deepest nodes`, async () => {
    const {page, close} = await open();
    const config = {tooltip: "deepest"};
    try {
      await draw(page, "Icicle", config, renderer);
      const west = await shapePoint(page, 'icicle-["West"]');
      const oregon = 'icicle-["West","Oregon"]';
      assert.deepStrictEqual(await hover(page, west), [], "a parent node");
      assert.deepStrictEqual(
        await hover(page, await shapePoint(page, oregon)),
        ["Oregon"],
        "a leaf node",
      );
      // Straight from the leaf onto its parent, the leaf's tooltip goes.
      await page.mouse.move(west[0], west[1], {steps: 3});
      await page.waitForTimeout(120);
      assert.deepStrictEqual(
        await page.evaluate(() => window.shown()),
        [],
        "a parent node, reached from a leaf",
      );
      assert.deepStrictEqual(
        await hoverLegend(page, "Icicle", config, "West"),
        [],
        "a parent's legend entry",
      );

      // Zoomed in, the focused parent keeps its own level.
      await page.mouse.click(west[0], west[1]);
      await page.waitForTimeout(400);
      assert.deepStrictEqual(
        await hover(page, await shapePoint(page, 'icicle-["West"]')),
        [],
        "the focused parent",
      );
      assert.deepStrictEqual(
        await hover(page, await shapePoint(page, oregon)),
        ["Oregon"],
        "a leaf of the focused parent",
      );
    } finally {
      await close();
    }
  });

  it(`tooltip depth (${renderer}): a Tree shows tooltips only on its leaves`, async () => {
    const {page, close} = await open();
    try {
      await draw(page, "Tree", {tooltip: "deepest", legend: false}, renderer);
      assert.deepStrictEqual(
        await hover(page, await shapePoint(page, "tree-Circle-South")),
        [],
        "a branch node",
      );
      assert.deepStrictEqual(
        await hover(page, await shapePoint(page, "tree-Circle-Texas")),
        ["Texas"],
        "a leaf node",
      );
    } finally {
      await close();
    }
  });

  it(`tooltip depth (${renderer}): the accessor receives each item's levels`, async () => {
    const {page, close} = await open();
    // The levels the accessor is called with as the pointer moves within the
    // shape keyed `key`, once the moves that brought it there have settled.
    const levels = async key => {
      const point = await shapePoint(page, key);
      const titles = await hover(page, point);
      await page.evaluate(() => void (window.__calls = []));
      await page.mouse.move(point[0] + 2, point[1] + 2);
      await page.waitForTimeout(60);
      const seen = await page.evaluate(() =>
        [...new Set(window.__calls.map(c => JSON.stringify(c)))].map(s =>
          JSON.parse(s),
        ),
      );
      return [titles, seen];
    };
    try {
      await draw(page, "Icicle", {tooltip: "calls"}, renderer);
      assert.deepStrictEqual(await levels('icicle-["South"]'), [
        ["South"],
        [{depth: 0, maxDepth: 1}],
      ]);
      assert.deepStrictEqual(await levels('icicle-["South","Texas"]'), [
        ["Texas"],
        [{depth: 1, maxDepth: 1}],
      ]);

      // A single groupBy level is its own deepest level.
      await draw(
        page,
        "Treemap",
        {groupBy: "state", tooltip: "calls"},
        renderer,
      );
      assert.deepStrictEqual(await levels("treemap-Texas"), [
        ["Texas"],
        [{depth: 0, maxDepth: 0}],
      ]);
    } finally {
      await close();
    }
  });
}

it("tooltip depth: a boolean or a two-argument accessor behaves as before", async () => {
  const {page, close} = await open();
  const titles = async config => {
    await draw(page, "Icicle", config, "svg");
    const out = [];
    for (const key of ['["West"]', '["West","Oregon"]', '["South"]'])
      out.push(await hover(page, await shapePoint(page, `icicle-${key}`)));
    out.push(await hoverLegend(page, "Icicle", config, "West"));
    return out;
  };
  try {
    assert.deepStrictEqual(
      await titles({}),
      [["West"], ["Oregon"], ["South"], ["West"]],
      "on by default, at every level and in the legend",
    );
    assert.deepStrictEqual(
      await titles({tooltip: "west"}),
      [["West"], ["Oregon"], [], ["West"]],
      "a (d, i) accessor picks by datum",
    );
    assert.deepStrictEqual(
      await titles({tooltip: "off"}),
      [[], [], [], []],
      "false turns every tooltip off",
    );
  } finally {
    await close();
  }
});
