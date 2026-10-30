import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Keyboard navigation in Chromium, on SVG and Canvas: the chart is one Tab
    stop with a role and a name; focusing it focuses the first mark, arrow
    keys move between bars (or a line's points, with the shared tooltip),
    showing the tooltip, hover, and focus ring and announcing the mark;
    Enter fires click handlers and drills down or toggles a legend item;
    Escape clears; focus survives a data update; `keyboardNav(false)` adds
    nothing.
*/

const sales = [
  {region: "North", sales: 42},
  {region: "South", sales: 58},
  {region: "East", sales: 30},
  {region: "West", sales: 51},
];

const series = [
  {year: 2020, id: "A", value: 10},
  {year: 2021, id: "A", value: 14},
  {year: 2022, id: "A", value: 12},
  {year: 2020, id: "B", value: 4},
  {year: 2021, id: "B", value: 7},
  {year: 2022, id: "B", value: 9},
];

/**
    Runs in the page: draws `chart` from `config`, then plays `steps` against
    its keyboard host, recording what the chart shows after each one: the
    focused target id, the live region's text, the tooltip's title, the hover
    state, the ring in the painted scene, and any click handler calls.
*/
const scenario = async ({
  chart,
  config,
  renderer,
  steps,
  on = "click.shape",
}) => {
  const clicks = [];
  const viz = new window.d3plus[chart]()
    .duration(0)
    .config(JSON.parse(JSON.stringify(config)))
    .select("#viz")
    .renderer(renderer)
    .width(600)
    .height(400)
    .on(on, d => clicks.push(d));
  window.__viz = viz;
  await new Promise(r => viz.render(r));
  const wait = (ms = 40) =>
    new Promise(r => requestAnimationFrame(() => setTimeout(r, ms)));
  const host = () => document.querySelector("#viz .d3plus-keyboard-nav");
  const key = (k, extra = {}) =>
    host().dispatchEvent(
      new KeyboardEvent("keydown", {key: k, bubbles: true, ...extra}),
    );
  const ring = () => {
    const root = viz._paintedScene.root;
    return root.children.some(n => n.key === "viz-focus");
  };
  const tooltip = () => {
    const el = document.querySelector(".d3plus-tooltip");
    if (!el || getComputedStyle(el).opacity === "0") return null;
    const title = el.querySelector(".d3plus-t-title");
    return title ? title.textContent : el.textContent;
  };
  const records = [];
  for (const step of steps) {
    if (step === "focus") host().focus();
    else if (step === "blur") host().blur();
    else if (step === "update")
      await new Promise(r =>
        viz.data(viz.data().map(d => ({...d, sales: d.sales + 1}))).render(r),
      );
    else if (step === "off") {
      viz.keyboardNav(false);
      await new Promise(r => viz.render(r));
    } else if (step.wait) await new Promise(r => setTimeout(r, step.wait));
    else if (step.key) key(step.key, step.init);
    await wait();
    if (step === "record" || step.record)
      records.push({
        current: viz._keyboardNav ? viz._keyboardNav.current : null,
        live: host() ? host().querySelector("[aria-live]").textContent : null,
        tooltip: tooltip(),
        hover: typeof viz._hover === "function",
        ring: ring(),
        shared: !!viz._sharedHoverActive,
        clicks: clicks.length,
        lastClick: clicks.length ? clicks[clicks.length - 1] : null,
        active: document.activeElement === host(),
        depth: viz._drawDepth,
        legendHidden: [...(viz._hidden || [])],
      });
  }
  const h = host();
  return {
    records,
    host: h
      ? {
          tabindex: h.getAttribute("tabindex"),
          role: h.getAttribute("role"),
          label: h.getAttribute("aria-label"),
          roledescription: h.getAttribute("aria-roledescription"),
          describedby: (h.getAttribute("aria-describedby") || "")
            .split(" ")
            .map(id => document.getElementById(id)?.textContent || ""),
          insideHidden: !!h.closest("[aria-hidden='true']"),
        }
      : null,
  };
};

const bar = {
  data: sales,
  groupBy: "region",
  x: "region",
  y: "sales",
  legend: false,
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] the chart is one named Tab stop`, async () => {
    const {host} = await render('<div id="viz"></div>', scenario, {
      chart: "BarChart",
      config: {...bar, title: "Sales by Region"},
      renderer,
      steps: [],
    });
    assert.strictEqual(host.tabindex, "0");
    assert.strictEqual(host.role, "application");
    assert.strictEqual(host.label, "Sales by Region");
    assert.strictEqual(host.roledescription, "interactive chart");
    assert.ok(/arrow keys/.test(host.describedby.join(" ")));
    assert.strictEqual(host.insideHidden, false);
  });

  it(`[${renderer}] arrows move between bars with tooltip, hover and ring`, async () => {
    const {records} = await render('<div id="viz"></div>', scenario, {
      chart: "BarChart",
      config: bar,
      renderer,
      steps: [
        "focus",
        "record",
        {key: "ArrowRight", record: true},
        {key: "ArrowRight", record: true},
        {key: "End", record: true},
        {key: "ArrowRight", record: true},
        {key: "Home", record: true},
        {key: "ArrowLeft", record: true},
      ],
    });
    const lives = records.map(r => r.live.split(",")[0]);
    assert.deepStrictEqual(lives, [
      "North",
      "South",
      "East",
      "West",
      "West",
      "North",
      "North",
    ]);
    for (const r of records) {
      assert.ok(r.ring, "draws the focus ring");
      assert.ok(r.hover, "sets the hover");
      assert.ok(r.tooltip, "shows the tooltip");
    }
    assert.ok(/South/.test(records[1].tooltip));
  });

  it(`[${renderer}] Enter clicks, Escape clears, blur clears`, async () => {
    const {records} = await render('<div id="viz"></div>', scenario, {
      chart: "BarChart",
      config: bar,
      renderer,
      steps: [
        "focus",
        {key: "ArrowRight"},
        {key: "Enter", record: true},
        {key: "Escape", record: true},
        {key: "ArrowRight", record: true},
        "blur",
        "record",
      ],
    });
    const [enter, escape, again, blurred] = records;
    assert.strictEqual(enter.clicks, 1);
    assert.strictEqual(enter.lastClick.region, "South");
    assert.strictEqual(escape.current, null);
    assert.strictEqual(escape.tooltip, null);
    assert.strictEqual(escape.hover, false);
    assert.strictEqual(escape.ring, false);
    assert.strictEqual(escape.active, true, "focus stays on the chart");
    assert.ok(again.current, "an arrow refocuses a mark");
    assert.strictEqual(blurred.current, null);
    assert.strictEqual(blurred.tooltip, null);
    assert.strictEqual(blurred.ring, false);
  });

  it(`[${renderer}] Enter drills down a nested chart`, async () => {
    const {records} = await render('<div id="viz"></div>', scenario, {
      chart: "Treemap",
      config: {
        data: [
          {parent: "A", id: "a1", value: 10},
          {parent: "A", id: "a2", value: 6},
          {parent: "B", id: "b1", value: 8},
        ],
        groupBy: ["parent", "id"],
        depth: 0,
        sum: "value",
        legend: false,
      },
      renderer,
      on: "click",
      steps: ["focus", "record", {key: "Enter"}, "record"],
    });
    assert.strictEqual(records[0].depth, 0);
    assert.strictEqual(records[1].depth, 1);
    assert.ok(records[1].current, "a mark of the new level is focused");
    assert.ok(records[1].ring);
  });

  it(`[${renderer}] a drill-down transition defers the replayed hover`, async () => {
    const {records} = await render('<div id="viz"></div>', scenario, {
      chart: "Treemap",
      config: {
        data: [
          {parent: "A", id: "a1", value: 10},
          {parent: "A", id: "a2", value: 6},
          {parent: "B", id: "b1", value: 8},
        ],
        groupBy: ["parent", "id"],
        depth: 0,
        duration: 300,
        sum: "value",
        legend: false,
      },
      renderer,
      on: "click",
      steps: [{wait: 400}, "focus", {key: "Enter"}, {wait: 500}, "record"],
    });
    const [after] = records;
    assert.strictEqual(after.depth, 1);
    // The clicked group's own tile is still drawn, now as the whole level.
    assert.ok(/100%/.test(after.live), after.live);
    assert.ok(after.tooltip, "the tooltip shows once the transition ends");
    assert.ok(after.hover);
    assert.ok(after.ring);
  });

  it(`[${renderer}] arrows cross small-multiple panels`, async () => {
    const {records} = await render('<div id="viz"></div>', scenario, {
      chart: "BarChart",
      config: {
        data: [
          ...sales.map(d => ({...d, year: 2023})),
          ...sales.map(d => ({...d, year: 2024, sales: d.sales + 5})),
        ],
        groupBy: "region",
        x: "region",
        y: "sales",
        facet: "year",
        legend: false,
      },
      renderer,
      steps: ["focus", "record", {key: "End", record: true}],
    });
    assert.ok(/^North/.test(records[0].live), records[0].live);
    assert.ok(/^West/.test(records[1].live), records[1].live);
    assert.ok(/y: 56/.test(records[1].live), records[1].live);
    assert.ok(/West/.test(records[1].tooltip), records[1].tooltip);
    assert.notStrictEqual(records[0].current, records[1].current);
  });

  it(`[${renderer}] a LinePlot steps through points with the shared tooltip`, async () => {
    const {records} = await render('<div id="viz"></div>', scenario, {
      chart: "LinePlot",
      config: {data: series, groupBy: "id", x: "year", y: "value"},
      renderer,
      steps: [
        "focus",
        "record",
        {key: "ArrowRight", record: true},
        {key: "ArrowRight", record: true},
        {key: "ArrowDown", record: true},
      ],
    });
    const ids = records.map(r => r.current.split("@")[1]);
    const names = records.map(r => r.live.split(",")[0]);
    assert.deepStrictEqual(ids, ["0", "1", "2", "2"]);
    assert.deepStrictEqual(names, ["A", "A", "A", "B"]);
    for (const r of records) {
      assert.ok(r.shared, "the shared tooltip is active");
      assert.ok(r.ring);
    }
    assert.ok(/2021/.test(records[1].live), records[1].live);
  });

  it(`[${renderer}] Enter toggles a legend item`, async () => {
    const {records} = await render('<div id="viz"></div>', scenario, {
      chart: "BarChart",
      config: {...bar, legend: true},
      renderer,
      steps: [
        "focus",
        {key: "End", record: true},
        {key: "Enter", record: true},
      ],
    });
    assert.ok(/West/.test(records[0].live));
    assert.notDeepStrictEqual(
      records[1].legendHidden,
      records[0].legendHidden,
      "the legend click changed the hidden items",
    );
    assert.strictEqual(records[1].current, records[0].current);
  });

  it(`[${renderer}] focus survives a data update`, async () => {
    const {records} = await render('<div id="viz"></div>', scenario, {
      chart: "BarChart",
      config: bar,
      renderer,
      steps: ["focus", {key: "ArrowRight", record: true}, "update", "record"],
    });
    assert.strictEqual(records[1].current, records[0].current);
    assert.ok(records[1].ring);
    assert.ok(/South/.test(records[1].tooltip));
    assert.ok(/59/.test(records[1].live), records[1].live);
  });

  it(`[${renderer}] keyboardNav(false) adds no Tab stop`, async () => {
    const off = await render('<div id="viz"></div>', scenario, {
      chart: "BarChart",
      config: {...bar, keyboardNav: false},
      renderer,
      steps: [],
    });
    assert.strictEqual(off.host, null);
    const toggled = await render('<div id="viz"></div>', scenario, {
      chart: "BarChart",
      config: bar,
      renderer,
      steps: ["focus", {key: "ArrowRight"}, "off", "record"],
    });
    assert.strictEqual(toggled.host, null);
    assert.strictEqual(toggled.records[0].ring, false);
    assert.strictEqual(toggled.records[0].tooltip, null);
  });
}
