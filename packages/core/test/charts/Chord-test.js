import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

const box = "<div id='viz' style='width:420px;height:420px'></div>";

it("Chord emits one arc per node, one ribbon per directed flow, and a label per node", async function () {
  this.timeout(60000);
  const result = await render(box, async () => {
    const viz = new window.d3plus.Chord()
      .select("#viz")
      .links([
        {source: "A", target: "B", value: 5},
        {source: "A", target: "C", value: 3},
        {source: "B", target: "C", value: 2},
        {source: "D", target: "A", value: 6},
      ])
      .value("value")
      .width(420).height(420).duration(0);
    await new Promise(r => viz.render(r));
    const svg = document.querySelector("#viz svg");
    return {
      paths: svg.querySelectorAll("path").length,
      labels: Array.from(svg.querySelectorAll("text")).map(t => t.textContent).sort(),
    };
  });
  // 4 nodes (A,B,C,D) → 4 arcs; 4 directed links → 4 ribbons.
  assert.strictEqual(result.paths, 8, "4 arcs + 4 ribbons");
  assert.deepStrictEqual(result.labels, ["A", "B", "C", "D"], "one label per node");
});

it("Chord drops links naming an endpoint absent from the node set", async function () {
  this.timeout(60000);
  const result = await render(box, async () => {
    const viz = new window.d3plus.Chord()
      .select("#viz")
      .nodes([{id: "A"}, {id: "B"}, {id: "C"}])
      .links([
        {source: "A", target: "B", value: 5},
        {source: "B", target: "C", value: 2},
        {source: "A", target: "ZZZ", value: 9}, // ZZZ absent → dropped
      ])
      .value("value")
      .width(420).height(420).duration(0);
    let err = null;
    try {
      await new Promise(r => viz.render(r));
    } catch (e) {
      err = String(e);
    }
    const svg = document.querySelector("#viz svg");
    return {err, paths: svg ? svg.querySelectorAll("path").length : 0};
  });
  assert.strictEqual(result.err, null, "renders without error");
  // 3 nodes → 3 arcs; 2 valid links → 2 ribbons (the A→ZZZ link is dropped).
  assert.strictEqual(result.paths, 5, "3 arcs + 2 ribbons, dropped link excluded");
});

it("Chord renders undirected with .directed(false)", async function () {
  this.timeout(60000);
  const result = await render(box, async () => {
    const viz = new window.d3plus.Chord()
      .select("#viz")
      .directed(false)
      .links([
        {source: "A", target: "B", value: 5},
        {source: "B", target: "A", value: 4}, // combined into one undirected chord
        // A node's undirected arc size is its *outgoing* total only (d3.chord's
        // own convention) — C must appear as a source at least once, or its arc
        // collapses to zero width.
        {source: "C", target: "B", value: 2},
      ])
      .value("value")
      .width(420).height(420).duration(0);
    await new Promise(r => viz.render(r));
    const svg = document.querySelector("#viz svg");
    return {paths: svg.querySelectorAll("path").length};
  });
  // 3 nodes → 3 arcs; undirected merges A↔B into one chord, plus B↔C → 2 ribbons.
  assert.strictEqual(result.paths, 5, "3 arcs + 2 undirected ribbons");
});

it("Chord handles empty data without error", async function () {
  this.timeout(60000);
  const result = await render(box, async () => {
    const viz = new window.d3plus.Chord()
      .select("#viz")
      .links([])
      .width(420).height(420).duration(0);
    let err = null;
    try {
      await new Promise(r => viz.render(r));
    } catch (e) {
      err = String(e);
    }
    return {err};
  });
  assert.strictEqual(result.err, null, "empty data renders without error");
});

it("Chord renders a self-loop (source === target) without error", async function () {
  this.timeout(60000);
  const result = await render(box, async () => {
    const viz = new window.d3plus.Chord()
      .select("#viz")
      .links([
        {source: "A", target: "A", value: 4},
        {source: "A", target: "B", value: 3},
      ])
      .value("value")
      .width(420).height(420).duration(0);
    let err = null;
    try {
      await new Promise(r => viz.render(r));
    } catch (e) {
      err = String(e);
    }
    const svg = document.querySelector("#viz svg");
    return {err, paths: svg ? svg.querySelectorAll("path").length : 0};
  });
  assert.strictEqual(result.err, null, "renders without error");
  // 2 nodes → 2 arcs; 2 links (one self-loop) → 2 ribbons.
  assert.strictEqual(result.paths, 4, "2 arcs + 2 ribbons including the self-loop");
});

it("Chord .arrows(true) uses ribbonArrow (no extra triangle nodes, ribbons keep drawing)", async function () {
  this.timeout(60000);
  const result = await render(box, async () => {
    const build = arrows => new Promise(res => {
      document.querySelector("#viz").innerHTML = "";
      const viz = new window.d3plus.Chord()
        .select("#viz")
        .arrows(arrows)
        .links([
          {source: "A", target: "B", value: 5},
          {source: "B", target: "C", value: 2},
        ])
        .value("value")
        .width(420).height(420).duration(0);
      viz.render(() => res(document.querySelector("#viz svg").querySelectorAll("path").length));
    });
    return {off: await build(false), on: await build(true)};
  });
  // Chord arrowheads are baked into the ribbon path (ribbonArrow), so the path
  // count is identical — arrows don't add separate triangle nodes here.
  assert.strictEqual(result.on, result.off, "ribbonArrow keeps the same path count");
});

it("Chord colors groups by a custom nodeId", async function () {
  this.timeout(60000);
  const result = await render(box, async () => {
    const viz = new window.d3plus.Chord()
      .select("#viz")
      .nodeId("key")
      .label(d => d.name)
      .nodes([
        {key: "eng", name: "Engineering"},
        {key: "sls", name: "Sales"},
        {key: "sup", name: "Support"},
      ])
      .links([
        {source: "eng", target: "sup", value: 6},
        {source: "sls", target: "sup", value: 4},
      ])
      .value("value")
      .width(420).height(420).duration(0);
    await new Promise(r => viz.render(r));
    const svg = document.querySelector("#viz svg");
    return Array.from(svg.querySelectorAll("path")).map(p => p.getAttribute("fill"));
  });
  // 3 arcs + 2 ribbons; each node gets its own color, not one shared grey.
  assert.strictEqual(result.length, 5);
  assert.strictEqual(new Set(result).size, 3, `one color per node, got ${result.join(", ")}`);
});

it("Chord ribbons fade in with the arcs instead of appearing instantly", async function () {
  this.timeout(60000);
  const result = await render(box, async () => {
    const viz = new window.d3plus.Chord()
      .select("#viz")
      .links([
        {source: "A", target: "B", value: 5},
        {source: "B", target: "C", value: 2},
      ])
      .value("value")
      .width(420).height(420).duration(1000);
    viz.render();
    // Sample partway through the enter transition.
    const deadline = Date.now() + 10000;
    let ribbons = [];
    while (Date.now() < deadline) {
      ribbons = Array.from(document.querySelectorAll("#viz svg path[fill-opacity]"));
      if (ribbons.length) break;
      await new Promise(r => window.setTimeout(r, 20));
    }
    await new Promise(r => window.setTimeout(r, 250));
    return ribbons.map(p => p.getAttribute("opacity"));
  });
  assert.strictEqual(result.length, 2, "two ribbons found");
  for (const o of result) {
    assert.notStrictEqual(o, null, "ribbon has an opacity attribute mid-transition");
    const n = Number(o);
    assert.ok(n > 0 && n < 1, `ribbon opacity is mid-fade, got ${o}`);
  }
});
