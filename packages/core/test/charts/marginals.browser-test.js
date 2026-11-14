import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart} from "~test/browser/helpers.js";

/**
    `marginals` in a real browser, on both renderers: the strips sit above
    and right of the plot inside the chart, summarize exactly the points the
    chart draws (legend hides included), link hover both ways, and stay off
    a chart with a category axis.
*/

/** Two groups of 20 points, spread over both axes. */
const data = Array.from({length: 40}, (_, k) => ({
  id: `p${k}`,
  group: k % 2 ? "b" : "a",
  facet: k < 20 ? "left" : "right",
  x: ((k * 37) % 50) / 5 + (k % 2) * 4,
  y: ((k * 13) % 40) / 4 + (k % 2 ? 0 : 6),
}));

const src = (config, kind = "Scatter") => `(lib, data) => new lib.${kind}()
  .data(data)
  .groupBy(["group", "id"])
  .x("x")
  .y("y")
  .detectVisible(false)
  .config(${JSON.stringify(config)})`;

/** The extraction run in the page: the marginal marks and the plot's rect. */
const extract = viz => {
  const walk = n => [n, ...(n.children || []).flatMap(walk)];
  const marks = (viz._chartScene || []).flatMap(walk).filter(n => n.marginal);
  const a = viz._plotArea;
  const box = n =>
    n.type === "rect"
      ? [n.x, n.y, n.x + n.width, n.y + n.height]
      : n.type === "circle"
        ? [n.cx, n.cy, n.cx, n.cy]
        : (
            n.points ||
            n.d
              .slice(1, -1)
              .split("L")
              .map(p => p.split(",").map(Number))
          ).reduce(
            (b, [x, y]) => [
              Math.min(b[0], x),
              Math.min(b[1], y),
              Math.max(b[2], x),
              Math.max(b[3], y),
            ],
            [Infinity, Infinity, -Infinity, -Infinity],
          );
  return {
    plot: {left: a.x, top: a.y, right: a.x + a.width, bottom: a.y + a.height},
    transform: viz._chartTransform,
    width: viz.schema.width,
    marks: marks.map(n => ({
      key: n.key,
      type: n.type,
      axis: n.marginal.axis,
      kind: n.marginal.kind,
      series: n.marginal.series.label,
      rows: n.marginal.rows.length,
      box: box(n),
    })),
  };
};

const sum = arr => arr.reduce((a, b) => a + b, 0);
const near = (a, b) => Math.abs(a - b) < 1;

for (const renderer of ["svg", "canvas"]) {
  it(`marginals ${renderer} — histogram strips above and right of the plot`, async () => {
    const out = await probeChart(src({marginals: "histogram"}), extract, {
      data,
      renderer,
    });
    const xs = out.marks.filter(m => m.axis === "x");
    const ys = out.marks.filter(m => m.axis === "y");
    assert.ok(xs.length && ys.length, "both strips draw");
    assert.strictEqual(sum(xs.map(m => m.rows)), data.length);
    assert.strictEqual(sum(ys.map(m => m.rows)), data.length);
    assert.deepStrictEqual([...new Set(xs.map(m => m.series))].sort(), [
      "a",
      "b",
    ]);
    const {plot, transform, width} = out;
    for (const m of xs) {
      assert.ok(m.box[3] < plot.top, `${m.key} sits above the plot`);
      assert.ok(m.box[1] + transform.y >= -0.5, `${m.key} stays in the chart`);
      assert.ok(m.box[0] >= plot.left - 0.5 && m.box[2] <= plot.right + 0.5);
    }
    for (const m of ys) {
      assert.ok(m.box[0] > plot.right, `${m.key} sits right of the plot`);
      assert.ok(m.box[2] + transform.x <= width + 0.5, `${m.key} fits`);
      assert.ok(m.box[1] >= plot.top - 0.5 && m.box[3] <= plot.bottom + 0.5);
    }
  });

  it(`marginals ${renderer} — box and density strips, and one axis at a time`, async () => {
    const out = await probeChart(
      src({marginals: {x: "box", y: "density"}}),
      extract,
      {data, renderer},
    );
    assert.ok(out.marks.some(m => m.axis === "x" && m.kind === "box"));
    assert.ok(
      out.marks.some(m => m.axis === "y" && m.type === "path"),
      "a density curve",
    );
    const none = await probeChart(src({}), extract, {data, renderer});
    const xOnly = await probeChart(
      src({marginals: {x: "histogram"}}),
      extract,
      {
        data,
        renderer,
      },
    );
    assert.strictEqual(none.marks.length, 0);
    assert.ok(xOnly.marks.every(m => m.axis === "x"));
    // The top strip takes room above the plot; without a right strip, the
    // plot keeps its width.
    assert.ok(
      xOnly.transform.y + xOnly.plot.top >
        none.transform.y + none.plot.top + 20,
    );
    assert.ok(
      near(
        xOnly.plot.right - xOnly.plot.left,
        none.plot.right - none.plot.left,
      ),
    );
    assert.ok(
      out.plot.right - out.plot.left < none.plot.right - none.plot.left - 20,
      "a right strip narrows the plot",
    );
  });

  it(`marginals ${renderer} — a category axis draws no strips`, async () => {
    const out = await probeChart(
      src({marginals: "histogram", discrete: "x", x: "group"}),
      extract,
      {data, renderer},
    );
    assert.strictEqual(out.marks.length, 0);
  });

  it(`marginals ${renderer} — hiding a legend entry drops its points from the strips`, async () => {
    const out = await probeChart(
      src({marginals: "histogram"}),
      viz =>
        new Promise(resolve => {
          const entry = viz._legendClass.data().find(d => d.group === "b");
          viz.render(() => resolve(extract(viz)));
          viz.schema.on["click.legend"](entry, 0, undefined, {shiftKey: false});
        }),
      {data, renderer},
    );
    const xs = out.marks.filter(m => m.axis === "x");
    assert.deepStrictEqual([...new Set(xs.map(m => m.series))], ["a"]);
    assert.strictEqual(sum(xs.map(m => m.rows)), 20);
  });

  it(`marginals ${renderer} — the strips follow the timeline and filter`, async () => {
    const years = data.map((d, k) => ({...d, year: k < 30 ? 2021 : 2020}));
    const timeline = await probeChart(
      src({marginals: "box", time: "year"}),
      extract,
      {data: years, renderer},
    );
    const boxes = timeline.marks.filter(
      m => m.axis === "x" && m.type === "rect",
    );
    assert.strictEqual(
      sum(boxes.map(m => m.rows)),
      30,
      "the latest year's points",
    );
    const filtered = await probeChart(
      `${src({marginals: "histogram"})}.filter(d => d.x > 4)`,
      extract,
      {data, renderer},
    );
    const kept = data.filter(d => d.x > 4).length;
    assert.strictEqual(
      sum(filtered.marks.filter(m => m.axis === "y").map(m => m.rows)),
      kept,
    );
  });

  it(`marginals ${renderer} — hover links a point to its bins and a bin to its points`, async () => {
    const out = await probeChart(
      src({marginals: "histogram"}),
      async viz => {
        const walk = n => [n, ...(n.children || []).flatMap(walk)];
        const frame = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
        const send = (type, node) =>
          viz._routeSceneEvent({
            type,
            point: [1, 1],
            pick: node ? {node, datum: node.datum, index: node.index} : null,
            nativeEvent: {
              type,
              stopPropagation() {},
              clientX: 10,
              clientY: 10,
            },
          });
        const scene = () => viz._paintedScene.root.children.flatMap(walk);
        const lit = n => (n.paint?.opacity ?? 1) === 1;
        const nodes = viz._chartScene.flatMap(walk);
        const point = nodes.find(
          n =>
            n.shapeType === "Circle" &&
            n.datum &&
            !String(n.key).endsWith("::hit"),
        );
        send("mouseenter", point);
        send("mousemove", point);
        await frame();
        const holding = scene()
          .filter(n => n.marginal && n.type === "rect")
          .map(n => ({
            lit: lit(n),
            holds: n.marginal.rows.includes(point.datum.data),
            axis: n.marginal.axis,
          }));
        send("mouseleave", null);
        const bin = nodes.find(
          n =>
            n.marginal && n.marginal.axis === "x" && n.marginal.rows.length > 1,
        );
        send("mouseenter", bin);
        send("mousemove", bin);
        await frame();
        const members = new Set(bin.marginal.rows);
        const points = scene().filter(
          n =>
            n.shapeType === "Circle" &&
            n.datum?.data &&
            n.interactionGroup !== "legend" &&
            !String(n.key).endsWith("::hit"),
        );
        const tip = document.querySelector(".d3plus-tooltip");
        const byBin = {
          litMembers: points.filter(n => members.has(n.datum.data) && lit(n))
            .length,
          litOthers: points.filter(n => !members.has(n.datum.data) && lit(n))
            .length,
          members: members.size,
          tooltip: tip ? tip.textContent : "",
          count: String(bin.marginal.rows.length),
        };
        send("mouseleave", null);
        await frame();
        return {holding, byBin, cleared: typeof viz.hover() !== "function"};
      },
      {data, renderer},
    );
    const {holding, byBin} = out;
    assert.strictEqual(
      holding.filter(h => h.holds).length,
      2,
      "one bin per axis",
    );
    assert.ok(
      holding.every(h => h.lit === h.holds),
      "only its bins stay lit",
    );
    assert.strictEqual(byBin.litMembers, byBin.members);
    assert.strictEqual(byBin.litOthers, 0);
    assert.ok(byBin.tooltip.includes("Count"), byBin.tooltip);
    assert.ok(byBin.tooltip.includes(byBin.count));
    assert.ok(out.cleared, "leaving clears the hover");
  });

  it(`marginals ${renderer} — each small-multiple panel draws its own strips`, async () => {
    const out = await probeChart(
      `${src({marginals: "density"})}.facet("facet")`,
      viz =>
        (viz._facetPanels || []).map(p => {
          const walk = n => [n, ...(n.children || []).flatMap(walk)];
          const marks = [p.scene]
            .flat()
            .flatMap(walk)
            .filter(n => n.marginal);
          return sum(
            marks
              .filter(n => n.type === "path" && n.marginal.axis === "x")
              .map(n => n.marginal.rows.length),
          );
        }),
      {
        data,
        renderer,
        html: '<div id="viz" style="width:700px;height:700px"></div>',
      },
    );
    assert.deepStrictEqual(out, [20, 20]);
  });
}
