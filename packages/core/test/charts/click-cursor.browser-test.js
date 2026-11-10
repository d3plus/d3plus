import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A shape or legend entry with a click action shows the pointer cursor
    whether or not it shows a tooltip: a tile that drills down keeps the hand
    with `tooltip: false`, or with a `tooltip` accessor that turns its level's
    tooltips off. Without a click action the cursor stays the default, and
    leaving the shape or entry, or clicking it, brings the default back. The
    cursor is read from the element under the pointer: with the SVG renderer
    a shape inside the chart's svg, with the Canvas renderer its canvas.
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
    window.SETTINGS = {
      deepest: {tooltip: (d, i, {depth, maxDepth}) => depth === maxDepth},
      off: {tooltip: false},
      click: {tooltip: false, on: {"click.shape": () => {}}},
      anyClick: {tooltip: false, on: {click: () => {}}},
    };
    // Draws a `chart` (a Treemap unless named) into `sel`, in place of the
    // one last drawn in #viz; `settings` names an entry of SETTINGS.
    window.make = (
      {chart = "Treemap", settings, ...config},
      renderer,
      sel = "#viz",
    ) =>
      new Promise(resolve => {
        if (sel === "#viz" && window.__viz) window.__viz.destroy();
        const viz = new window.d3plus[chart]()
          .config({
            data,
            groupBy: ["region", "state"],
            sum: "value",
            legend: true,
            duration: 0,
            ...config,
            ...window.SETTINGS[settings],
          })
          .renderer(renderer)
          .select(sel);
        if (sel === "#viz") window.__viz = viz;
        viz.render(() => resolve(viz));
      });
    // Client coordinates of the center of the tile keyed `key`.
    window.tilePoint = key => {
      const viz = window.__viz;
      const node = viz._chartScene.find(n => n.key === key);
      const surface = document
        .querySelector("#viz svg, #viz canvas")
        .getBoundingClientRect();
      const c = viz._chartTransform || {x: 0, y: 0};
      return [
        surface.left + c.x + node.x + node.width / 2,
        surface.top + c.y + node.y + node.height / 2,
      ];
    };
    // Client coordinates of the legend entry labelled `label`, read from the
    // same chart laid out in SVG, whose legend the canvas chart shares.
    window.legendPoint = async (config, label) => {
      const twin = await window.make(config, "svg", "#layout");
      const text = [
        ...document.querySelectorAll('#layout [data-key="viz-legend"] text'),
      ].find(t => t.textContent.trim() === label);
      const box = text.getBoundingClientRect();
      twin.destroy();
      document.querySelector("#layout").innerHTML = "";
      return [box.left + box.width / 2, box.top + box.height / 2];
    };
    // The cursor of the element under a point, the tooltips showing, and
    // whether the pointer is on a legend entry.
    window.state = ([x, y]) => {
      return {
        cursor: getComputedStyle(document.elementFromPoint(x, y)).cursor,
        tooltips: [...document.querySelectorAll(".d3plus-tooltip")]
          .filter(t => getComputedStyle(t).visibility === "visible")
          .map(t =>
            t.querySelector(".d3plus-tooltip-title").textContent.trim(),
          ),
        legend: Boolean(window.__viz._lastScenePick?.isLegend),
      };
    };
  }, data);
  return opened;
}

/** Draws the chart, moves the real pointer onto a point, and reads the state. */
async function hover(page, config, renderer, target) {
  await page.evaluate(
    ([config, renderer]) => window.make(config, renderer).then(() => null),
    [config, renderer],
  );
  const point = await page.evaluate(
    ([config, target]) =>
      target.legend
        ? window.legendPoint(config, target.legend)
        : window.tilePoint(target.tile),
    [config, target],
  );
  await page.mouse.move(5, 395);
  await page.waitForTimeout(40);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(120);
  return page.evaluate(point => window.state(point), point);
}

/** Moves the real pointer to the chart's empty corner and reads the cursor there. */
async function leave(page) {
  await page.mouse.move(5, 395);
  await page.waitForTimeout(60);
  return page.evaluate(() => window.state([5, 395]).cursor);
}

/** Clicks where the pointer rests and reads the state there once the chart settles. */
async function click(page, point) {
  await page.mouse.click(point[0], point[1]);
  await page.waitForTimeout(150);
  return page.evaluate(
    point => ({...window.state(point), depth: window.__viz._drawDepth}),
    point,
  );
}

const drill = {depth: 0, color: "state"};
const flat = {groupBy: "state"};
const west = {tile: "treemap-West"};
const texas = {tile: "treemap-Texas"};
const icicle = {chart: "Icicle"};

for (const renderer of ["svg", "canvas"]) {
  it(`click cursor (${renderer}): a tile that drills down shows the pointer without a tooltip`, async () => {
    const {page, close} = await open();
    try {
      assert.deepStrictEqual(
        await hover(page, drill, renderer, west),
        {cursor: "pointer", tooltips: ["West"], legend: false},
        "with its tooltip",
      );
      assert.deepStrictEqual(
        await hover(page, {...drill, settings: "deepest"}, renderer, west),
        {cursor: "pointer", tooltips: [], legend: false},
        "with a tooltip accessor that turns its level off",
      );
      assert.deepStrictEqual(
        await hover(page, {...drill, settings: "off"}, renderer, west),
        {cursor: "pointer", tooltips: [], legend: false},
        "with tooltip: false",
      );

      // Off the tile, the cursor is the default again.
      assert.strictEqual(await leave(page), "auto");
    } finally {
      await close();
    }
  });

  it(`click cursor (${renderer}): a tile with nothing to click keeps the default cursor`, async () => {
    const {page, close} = await open();
    try {
      assert.deepStrictEqual(
        await hover(page, flat, renderer, texas),
        {cursor: "auto", tooltips: ["Texas"], legend: false},
        "with its tooltip",
      );
      assert.deepStrictEqual(
        await hover(page, {...flat, settings: "off"}, renderer, texas),
        {cursor: "auto", tooltips: [], legend: false},
        "with tooltip: false",
      );
      assert.deepStrictEqual(
        await hover(page, {...flat, settings: "click"}, renderer, texas),
        {cursor: "pointer", tooltips: [], legend: false},
        "a click handler of the chart's own brings the pointer back",
      );
    } finally {
      await close();
    }
  });

  it(`click cursor (${renderer}): a legend entry follows the same rule`, async () => {
    const {page, close} = await open();
    try {
      assert.deepStrictEqual(
        await hover(page, drill, renderer, {legend: "West"}),
        {cursor: "pointer", tooltips: ["West"], legend: true},
        "with its tooltip",
      );
      assert.deepStrictEqual(
        await hover(page, {...drill, settings: "off"}, renderer, {
          legend: "West",
        }),
        {cursor: "pointer", tooltips: [], legend: true},
        "with tooltip: false",
      );
      assert.deepStrictEqual(
        await hover(page, {...flat, settings: "off"}, renderer, {
          legend: "Texas",
        }),
        {cursor: "auto", tooltips: [], legend: true},
        "the default cursor at the deepest level",
      );

      // Off the entry, the cursor is the default again.
      assert.strictEqual(
        (await hover(page, drill, renderer, {legend: "West"})).cursor,
        "pointer",
      );
      assert.strictEqual(await leave(page), "auto");
    } finally {
      await close();
    }
  });

  it(`click cursor (${renderer}): a click brings the default cursor back`, async () => {
    const {page, close} = await open();
    try {
      assert.strictEqual(
        (await hover(page, drill, renderer, west)).cursor,
        "pointer",
      );
      // After the drill the pointer rests on one of West's states, with
      // nothing to click.
      const point = await page.evaluate(() => window.tilePoint("treemap-West"));
      assert.deepStrictEqual(await click(page, point), {
        cursor: "auto",
        tooltips: [],
        legend: false,
        depth: 1,
      });

      // A click on a legend entry hides its group.
      assert.strictEqual(
        (await hover(page, drill, renderer, {legend: "West"})).cursor,
        "pointer",
      );
      const entry = await page.evaluate(
        config => window.legendPoint(config, "West"),
        drill,
      );
      assert.strictEqual((await click(page, entry)).cursor, "auto");
      assert.deepStrictEqual(await page.evaluate(() => window.__viz._hidden), [
        "West",
      ]);
    } finally {
      await close();
    }
  });

  it(`click cursor (${renderer}): a partition chart shows the pointer on a node that zooms`, async () => {
    const {page, close} = await open();
    try {
      assert.deepStrictEqual(
        await hover(page, icicle, renderer, {tile: 'icicle-["West"]'}),
        {cursor: "pointer", tooltips: ["West"], legend: false},
        "a node with children",
      );
      assert.strictEqual(await leave(page), "auto", "off the node");
      assert.deepStrictEqual(
        await hover(page, icicle, renderer, {
          tile: 'icicle-["West","Oregon"]',
        }),
        {cursor: "auto", tooltips: ["Oregon"], legend: false},
        "a leaf",
      );
      assert.deepStrictEqual(
        await hover(page, {...icicle, settings: "anyClick"}, renderer, {
          tile: 'icicle-["West","Oregon"]',
        }),
        {cursor: "pointer", tooltips: [], legend: false},
        "a leaf with a click handler of the chart's own",
      );
    } finally {
      await close();
    }
  });
}
