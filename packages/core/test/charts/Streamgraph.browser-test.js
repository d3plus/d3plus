import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";

/**
    Streamgraph in a real browser, on both renderers: every column of its
    layers centers on the middle of the plot area (a `"wiggle"` stream drifts
    instead), its value axis names no values while the x axis keeps every
    label, and hovering a layer still reports its value.
*/

const data = [];
["Rock", "Pop", "Jazz", "Folk", "Soul"].forEach((genre, g) => {
  for (let year = 2000; year <= 2010; year++)
    data.push({genre, year, sales: 10 + g * 4 + ((year * (g + 3)) % 7) * 2});
});

/** A linear area path's points, in chart content space. */
const pathPoints = node => {
  const nums = String(node.d)
    .match(/-?\d+(\.\d+)?(e-?\d+)?/g)
    .map(Number);
  const dx = node.transform?.x ?? 0;
  const dy = node.transform?.y ?? 0;
  const out = [];
  for (let i = 0; i + 1 < nums.length; i += 2)
    out.push([nums[i] + dx, nums[i + 1] + dy]);
  return out;
};

/** The texts drawn inside the scene group keyed `key`. */
const textsIn = (nodes, key) => {
  const group = nodes.find(n => n.key === key);
  return sceneNodes(group ? group.children || [] : [])
    .filter(n => n.type === "text")
    .map(n => n.lines.map(l => l.text).join(" "));
};

/** The stream's layers, each column's top and bottom edges, and the axes' texts. */
const streams = viz => {
  const nodes = sceneNodes(viz.toScene().root);
  const areas = nodes.filter(
    n => n.shapeType === "Area" && n.type === "path" && n.datum,
  );
  const columns = new Map();
  for (const a of areas)
    for (const [x, y] of pathPoints(a)) {
      const k = Math.round(x);
      const c = columns.get(k) || {top: Infinity, bottom: -Infinity};
      c.top = Math.min(c.top, y);
      c.bottom = Math.max(c.bottom, y);
      columns.set(k, c);
    }
  return {
    layers: areas.length,
    columns: [...columns.values()],
    plot: viz._plotArea,
    yText: textsIn(nodes, "plot-y-axis"),
    xText: textsIn(nodes, "plot-x-axis"),
  };
};

// Straight segments, so each path's numbers are exactly its points.
const src = config => `(lib, data) => new lib.Streamgraph()
  .data(data)
  .groupBy("genre")
  .x("year")
  .y("sales")
  .shapeConfig({Area: {curve: "linear"}})
  .config(${JSON.stringify(config)})`;

for (const renderer of ["svg", "canvas"]) {
  it(`Streamgraph ${renderer} — every column centers on the middle of the plot`, async () => {
    const out = await probeChart(src({}), streams, {data, renderer});
    assert.strictEqual(out.layers, 5);
    assert.strictEqual(out.columns.length, 11, "a column per year");
    const middle = out.plot.y + out.plot.height / 2;
    for (const c of out.columns)
      assert.ok(
        Math.abs((c.top + c.bottom) / 2 - middle) < 0.5,
        `column ${c.top}–${c.bottom} centers on ${middle}`,
      );
    const heights = out.columns.map(c => c.bottom - c.top);
    assert.ok(
      Math.max(...heights) - Math.min(...heights) > 10,
      "the baseline moves with the stack's total",
    );
  });

  it(`Streamgraph ${renderer} — "wiggle" lets the stream drift within the plot`, async () => {
    const out = await probeChart(src({stackOffset: "wiggle"}), streams, {
      data,
      renderer,
    });
    const centers = out.columns.map(c => (c.top + c.bottom) / 2);
    assert.ok(
      Math.max(...centers) - Math.min(...centers) > 1,
      "column centers differ",
    );
    const top = Math.min(...out.columns.map(c => c.top));
    const bottom = Math.max(...out.columns.map(c => c.bottom));
    assert.ok(top >= out.plot.y - 0.5, "inside the plot's top");
    assert.ok(bottom <= out.plot.y + out.plot.height + 0.5, "and bottom");
  });

  it(`Streamgraph ${renderer} — the value axis shows no values; the x axis keeps its labels`, async () => {
    const out = await probeChart(src({}), streams, {data, renderer});
    assert.deepStrictEqual(out.yText, ["sales"], "only the axis title");
    assert.deepStrictEqual(
      out.xText,
      Array.from({length: 11}, (_, i) => `${2000 + i}`),
    );
  });
}

it("Streamgraph — the value axis comes back through yConfig", async () => {
  const out = await probeChart(
    `${src({})}.yConfig({labels: undefined, ticks: undefined})`,
    streams,
    {data},
  );
  assert.ok(
    out.yText.some(t => /^-?\d/.test(t)),
    `numeric tick labels: ${out.yText}`,
  );
});

it("Streamgraph — hovering a layer shows its value and share", async () => {
  const tooltip = await probeChart(
    src({}),
    async viz => {
      const node = sceneNodes(viz.toScene().root).find(
        n => n.shapeType === "Area" && n.datum && n.datum.id === "Jazz",
      );
      const event = type =>
        viz._routeSceneEvent({
          type,
          point: [1, 1],
          pick: {node, datum: node.datum, index: node.index},
          nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
        });
      event("mouseenter");
      event("mousemove");
      await new Promise(resolve => setTimeout(resolve, 50));
      const el = document.querySelector(".d3plus-tooltip");
      return el ? el.textContent : "";
    },
    {data},
  );
  assert.ok(tooltip.includes("Jazz"), tooltip);
  assert.ok(/sales\s*\d/i.test(tooltip), tooltip);
  assert.ok(/Share\s*\d/.test(tooltip), tooltip);
});
