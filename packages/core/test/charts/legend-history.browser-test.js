import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Legend clicks on the Back history (#778), on SVG and Canvas: hiding and
    soloing push the state before each click, Back undoes them (and
    drill-downs) in the order they happened, a click that changes nothing
    adds no step, keyboard activation counts, linked charts follow Back, new
    data clears the legend's steps, and `legendHistory: false` keeps legend
    clicks off the history.
*/

const sales = [
  {region: "A", sales: 42},
  {region: "B", sales: 58},
  {region: "C", sales: 30},
];

const tree = [
  {g: "A", s: "A1", v: 10},
  {g: "A", s: "A2", v: 20},
  {g: "B", s: "B1", v: 30},
  {g: "B", s: "B2", v: 15},
  {g: "C", s: "C1", v: 25},
  {g: "C", s: "C2", v: 5},
];

/**
    Runs in the page: draws `chart` from `config`, then plays `steps`,
    recording the chart's legend state, history kinds, Back button, drawn
    depth and drawn row count after each `record` step. A step is
    `{legend: id, shift?}` (a legend click routed through the painted scene),
    `{shape: [level, value]}` (a click on the chart shape whose `groupBy` level
    holds that value), `{arc: path | "center"}` (a click on a Sunburst arc), `"back"` (the Back button), `"data"` (new data),
    `{key}` (a keydown on the keyboard host), or `"focus"`.
*/
const scenario = async ({chart, config, renderer, steps, linked}) => {
  const make = (selector, extra = {}) =>
    new window.d3plus[chart]()
      .duration(0)
      .config(JSON.parse(JSON.stringify({...config, ...extra})))
      .select(selector)
      .renderer(renderer)
      .width(500)
      .height(360);
  const viz = make("#viz", linked ? {link: "g"} : {});
  const other = linked ? make("#other", {link: "g"}) : null;
  await new Promise(r => viz.render(r));
  if (other) await new Promise(r => other.render(r));
  const wait = () =>
    new Promise(r => requestAnimationFrame(() => setTimeout(r, 60)));
  const nodes = () => {
    const out = [];
    const walk = n => {
      out.push(n);
      (n.children || []).forEach(walk);
    };
    walk(viz._paintedScene.root);
    return out;
  };
  const route = (node, shiftKey = false) =>
    viz._routeSceneEvent({
      type: "click",
      point: [0, 0],
      pick: {node, datum: node.datum, index: node.index},
      nativeEvent: {shiftKey, stopPropagation() {}},
    });
  const legendNode = id =>
    nodes().find(
      n =>
        n.interactionGroup === "legend" &&
        n.type !== "text" &&
        !`${n.key}`.endsWith("::hit") &&
        n.datum &&
        n.datum.data &&
        [].concat(viz._id(n.datum.data, n.datum.i))[0] === id,
    );
  const shapeNode = ([level, value]) =>
    nodes().find(n => {
      if (!n.datum || n.interactionGroup || n.type === "text") return false;
      const row = n.datum.data && n.datum.__d3plus__ ? n.datum.data : n.datum;
      return viz.schema.groupBy[level](row, 0) === value;
    });
  const host = () => document.querySelector("#viz .d3plus-keyboard-nav");
  const state = target => ({
    hidden: [...target._hidden],
    solo: [...target._solo],
    history: (target._history || []).map(e => e.kind || "drill"),
    back: !!target._select.node().parentNode.querySelector(".back-control"),
    depth: target._drawDepth,
    drawn: target._filteredData.length,
  });
  const records = [];
  for (const step of steps) {
    if (step === "back") {
      const button = document.querySelector("#viz .back-control");
      if (!button)
        throw new Error(`no Back button: ${JSON.stringify(records)}`);
      button.click();
    } else if (step === "data")
      viz.data(config.data.map(d => ({...d}))).render();
    else if (step === "focus") host().focus();
    else if (step.key)
      host().dispatchEvent(
        new KeyboardEvent("keydown", {key: step.key, bubbles: true}),
      );
    else if (step.legend !== undefined) {
      const node = legendNode(step.legend);
      if (!node)
        throw new Error(
          `no legend item ${step.legend}: ${JSON.stringify(viz._legendData.map((d, i) => viz._id(d, i)))}`,
        );
      route(node, step.shift);
    } else if (step.arc) {
      const laid = viz.ctx.sunburstLaid.find(n =>
        step.arc === "center"
          ? n.depth === 0
          : JSON.stringify(n.path) === JSON.stringify(step.arc),
      );
      route(nodes().find(n => !n.interactionGroup && n.datum === laid.datum));
    } else if (step.shape) {
      const node = shapeNode(step.shape);
      if (!node) throw new Error(`no shape ${step.shape}`);
      route(node);
    }
    await wait();
    if (step.record || ["record", "back", "data"].includes(step))
      records.push(other ? [state(viz), state(other)] : state(viz));
  }
  return records;
};

const run = (args, html = '<div id="viz"></div>') =>
  render(html, scenario, args);

const bar = {
  data: sales,
  groupBy: "region",
  x: "region",
  y: "sales",
  legend: true,
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] hide, solo, then Back twice restores each state and hides Back`, async () => {
    const records = await run({
      chart: "BarChart",
      config: bar,
      renderer,
      steps: [
        "record",
        {legend: "A", record: true},
        {legend: "B", shift: true, record: true},
        {legend: "B", shift: true, record: true},
        "back",
        "back",
      ],
    });
    const pick = r => [r.hidden, r.solo, r.history.length, r.back, r.drawn];
    assert.deepStrictEqual(records.map(pick), [
      [[], [], 0, false, 3],
      [["A"], [], 1, true, 2],
      [[], ["B"], 2, true, 1],
      [[], ["B"], 2, true, 1],
      [["A"], [], 1, true, 2],
      [[], [], 0, false, 3],
    ]);
  });

  it(`[${renderer}] Treemap: Back undoes legend clicks and drill-downs in order`, async () => {
    const records = await run({
      chart: "Treemap",
      config: {
        data: tree,
        groupBy: ["g", "s"],
        sum: "v",
        depth: 0,
        legend: true,
      },
      renderer,
      steps: [
        {legend: "C", record: true},
        {shape: [0, "A"], record: true},
        {legend: "A1", shift: true, record: true},
        "back",
        "back",
        "back",
      ],
    });
    const pick = r => [r.depth, r.hidden, r.solo, r.history, r.back];
    assert.deepStrictEqual(records.map(pick), [
      [0, ["C"], [], ["legend"], true],
      [1, [], [], ["legend", "drill"], true],
      [1, [], ["A1", "A2"], ["legend", "drill", "legend"], true],
      [1, [], [], ["legend", "drill"], true],
      [0, ["C"], [], ["legend"], true],
      [0, [], [], [], false],
    ]);
    assert.strictEqual(records[1].drawn, 2, "the drill shows A's children");
    assert.strictEqual(records[4].drawn, 2, "Back shows A and B, C hidden");
  });

  it(`[${renderer}] Treemap: a drill out of a solo'd group puts the solo back on Back`, async () => {
    const records = await run({
      chart: "Treemap",
      config: {
        data: tree,
        groupBy: ["g", "s"],
        sum: "v",
        depth: 0,
        legend: true,
      },
      renderer,
      steps: [
        {legend: "C", shift: true, record: true},
        {shape: [0, "C"], record: true},
        "back",
      ],
    });
    const pick = r => [r.depth, r.solo, r.drawn];
    assert.deepStrictEqual(records.map(pick), [
      [0, ["C"], 1],
      [1, [], 2],
      [0, ["C"], 1],
    ]);
  });

  it(`[${renderer}] Sunburst: legend clicks and zooms undo in order`, async () => {
    const records = await run({
      chart: "Sunburst",
      config: {data: tree, groupBy: ["g", "s"], sum: "v", legend: true},
      renderer,
      steps: [
        {legend: "C1", record: true},
        {arc: ["A"], record: true},
        "back",
        "back",
      ],
    });
    const pick = r => [r.hidden, r.history, r.back];
    assert.deepStrictEqual(records.map(pick), [
      [["C1", "C2"], ["legend"], true],
      [["C1", "C2"], ["legend", "drill"], true],
      [["C1", "C2"], ["legend"], true],
      [[], [], false],
    ]);
    assert.ok(records[1].drawn < records[0].drawn, "zoomed into A");
    assert.strictEqual(records[2].drawn, records[0].drawn, "zoomed out");
  });

  it(`[${renderer}] Sunburst: the center zooms out past later legend steps, keeping them`, async () => {
    const records = await run({
      chart: "Sunburst",
      config: {data: tree, groupBy: ["g", "s"], sum: "v", legend: true},
      renderer,
      steps: [
        {arc: ["A"], record: true},
        {legend: "A1", shift: true, record: true},
        {arc: "center", record: true},
        "back",
      ],
    });
    const pick = r => [r.solo, r.history, r.back];
    assert.deepStrictEqual(records.map(pick), [
      [[], ["drill"], true],
      [["A1", "A2"], ["drill", "legend"], true],
      [["A1", "A2"], ["legend"], true],
      [[], [], false],
    ]);
    assert.strictEqual(records[2].drawn, 2, "zoomed out, A's children solo'd");
  });

  it(`[${renderer}] Enter on a legend item pushes a step`, async () => {
    const records = await run({
      chart: "BarChart",
      config: bar,
      renderer,
      steps: [
        "focus",
        {key: "End", record: true},
        {key: "Enter", record: true},
        "back",
      ],
    });
    assert.deepStrictEqual(records[0].history, []);
    assert.deepStrictEqual(records[1].history, ["legend"]);
    assert.strictEqual(records[1].back, true);
    assert.ok(records[1].hidden.length || records[1].solo.length);
    assert.deepStrictEqual([records[2].hidden, records[2].history], [[], []]);
  });

  it(`[${renderer}] linked charts follow Back`, async () => {
    const records = await run(
      {
        chart: "BarChart",
        config: bar,
        renderer,
        linked: true,
        steps: [{legend: "A", record: true}, "back"],
      },
      '<div id="viz"></div><div id="other"></div>',
    );
    const [[a1, b1], [a2, b2]] = records;
    assert.deepStrictEqual([a1.hidden, b1.hidden], [["A"], ["A"]]);
    assert.deepStrictEqual(b1.history, [], "only the clicked chart records");
    assert.deepStrictEqual([a2.hidden, b2.hidden], [[], []]);
    assert.strictEqual(a2.back, false);
  });

  it(`[${renderer}] new data clears the legend's steps`, async () => {
    const records = await run({
      chart: "BarChart",
      config: bar,
      renderer,
      steps: [{legend: "A", record: true}, "data"],
    });
    assert.strictEqual(records[0].back, true);
    assert.deepStrictEqual(
      [records[1].hidden, records[1].history, records[1].back],
      [[], [], false],
    );
  });

  it(`[${renderer}] legendHistory: false keeps legend clicks off the history`, async () => {
    const records = await run({
      chart: "BarChart",
      config: {...bar, legendHistory: false},
      renderer,
      steps: [{legend: "A", record: true}],
    });
    assert.deepStrictEqual(
      [records[0].hidden, records[0].history, records[0].back],
      [["A"], [], false],
    );
  });

  it(`[${renderer}] small multiples: Back restores a legend click across panels`, async () => {
    const data = sales.flatMap(d => [
      {...d, year: 2020},
      {...d, year: 2021, sales: d.sales + 5},
    ]);
    const records = await run({
      chart: "BarChart",
      config: {...bar, data, facet: "year"},
      renderer,
      steps: [{legend: "A", record: true}, "back"],
    });
    assert.deepStrictEqual([records[0].hidden, records[0].back], [["A"], true]);
    assert.deepStrictEqual([records[1].hidden, records[1].back], [[], false]);
  });
}
