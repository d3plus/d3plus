import {it} from "vitest";
import assert from "assert";
import {area, line} from "d3-shape";

import {useJsdom} from "~test/jsdom.js";
import {
  CanvasRenderer,
  SvgRenderer,
  collapse,
  hasCurve,
  interpolateNode,
  interpolateSeries,
  seriesPath,
} from "../index.ts";

useJsdom({augment: false});

const xy = (...pts) => pts.map(([x, y]) => [x, y]);

it("seriesPath draws a line through a series' points", () => {
  const top = xy([0, 0], [10, 5], [20, 0]);
  assert.strictEqual(seriesPath({keys: [1, 2, 3], top}), line()(top));
});

it("seriesPath draws an area between a series' edges", () => {
  const top = xy([0, 0], [10, 5]);
  const base = xy([0, 20], [10, 20]);
  const expected = area()
    .x0(i => base[i][0])
    .y0(i => base[i][1])
    .x1(i => top[i][0])
    .y1(i => top[i][1])([0, 1]);
  assert.strictEqual(seriesPath({keys: ["a", "b"], top, base}), expected);
});

it("seriesPath draws with the series' curve", () => {
  const top = xy([0, 0], [10, 10], [20, 0]);
  assert.notStrictEqual(
    seriesPath({keys: [1, 2, 3], top, curve: "monotoneX"}),
    seriesPath({keys: [1, 2, 3], top}),
  );
});

it("hasCurve knows the curves the backends draw", () => {
  assert.ok(hasCurve(undefined));
  assert.ok(hasCurve("linear"));
  assert.ok(hasCurve("monotoneX"));
  assert.ok(hasCurve("bumpX"));
  assert.ok(!hasCurve("wobbly"));
  assert.ok(!hasCurve("toString"));
});

it("interpolateSeries slides kept points by key", () => {
  const a = {keys: [1, 2], top: xy([0, 0], [10, 10])};
  const b = {keys: [1, 2], top: xy([10, 0], [20, 20])};
  const tween = interpolateSeries(a, b);
  assert.deepStrictEqual(tween(0.5).top, xy([5, 0], [15, 15]));
  assert.strictEqual(tween(1), b);
});

it("interpolateSeries grows an appended point out of the last kept one", () => {
  const a = {keys: [1, 2], top: xy([0, 0], [100, 50])};
  const b = {keys: [1, 2, 3], top: xy([0, 0], [50, 50], [100, 0])};
  const tween = interpolateSeries(a, b);
  assert.deepStrictEqual(tween(0).keys, [1, 2, 3]);
  assert.deepStrictEqual(tween(0).top, xy([0, 0], [100, 50], [100, 50]));
  assert.deepStrictEqual(tween(0.5).top, xy([0, 0], [75, 50], [100, 25]));
});

it("interpolateSeries folds a dropped first point into the new first point", () => {
  // A sliding window: the oldest point leaves as the newest arrives.
  const a = {keys: [1, 2, 3], top: xy([0, 0], [50, 10], [100, 20])};
  const b = {keys: [2, 3, 4], top: xy([0, 10], [50, 20], [100, 30])};
  const tween = interpolateSeries(a, b);
  const start = tween(0);
  assert.deepStrictEqual(start.keys, [1, 2, 3, 4]);
  assert.deepStrictEqual(start.top, xy([0, 0], [50, 10], [100, 20], [100, 20]));
  const end = tween(0.999999);
  assert.deepStrictEqual(
    end.top.map(p => p.map(Math.round)),
    xy([0, 10], [0, 10], [50, 20], [100, 30]),
  );
});

it("interpolateSeries folds a dropped middle point into its previous neighbor", () => {
  const a = {keys: [1, 2, 3], top: xy([0, 0], [50, 50], [100, 0])};
  const b = {keys: [1, 3], top: xy([0, 0], [100, 0])};
  const tween = interpolateSeries(a, b);
  assert.deepStrictEqual(tween(0.5).keys, [1, 2, 3]);
  assert.deepStrictEqual(tween(0.5).top, xy([0, 0], [25, 25], [100, 0]));
});

it("interpolateSeries tweens an area's base edge with its top", () => {
  const a = {keys: [1], top: xy([0, 0]), base: xy([0, 100])};
  const b = {
    keys: [1, 2],
    top: xy([0, 10], [10, 10]),
    base: xy([0, 50], [10, 50]),
  };
  const tween = interpolateSeries(a, b);
  assert.deepStrictEqual(tween(0.5).base, xy([0, 75], [5, 75]));
  assert.deepStrictEqual(tween(0.5).top, xy([0, 5], [5, 5]));
});

it("interpolateSeries can't match series that share no order", () => {
  const top = xy([0, 0], [1, 1]);
  const b = {keys: [1, 2], top};
  assert.strictEqual(interpolateSeries({keys: [3, 4], top}, b), null);
  assert.strictEqual(interpolateSeries({keys: [1, 1], top}, b), null);
  assert.strictEqual(interpolateSeries({keys: [2, 1], top}, b), null);
  assert.strictEqual(
    interpolateSeries({keys: [1, 2], top, curve: "step"}, b),
    null,
  );
  assert.strictEqual(
    interpolateSeries({keys: [1, 2], top, base: top}, b),
    null,
  );
});

it("interpolateNode rebuilds a series path's d from the tweened points", () => {
  const from = {
    type: "path",
    key: "line",
    d: "M0,0L10,10",
    series: {keys: [1, 2], top: xy([0, 0], [10, 10])},
    paint: {},
  };
  const to = {
    type: "path",
    key: "line",
    d: "M0,10L10,20L20,0",
    series: {keys: [2, 3, 4], top: xy([0, 10], [10, 20], [20, 0])},
    paint: {},
  };
  const tween = interpolateNode(from, to);
  const mid = tween(0.5);
  assert.deepStrictEqual(mid.series.keys, [1, 2, 3, 4]);
  assert.strictEqual(mid.d, seriesPath(mid.series));
  assert.strictEqual(tween(1).d, to.d);
  assert.strictEqual(tween(1).series, to.series);
});

it("collapse drops an area's series where it swaps its d", () => {
  const node = {
    type: "path",
    key: "a",
    shapeType: "Area",
    d: "M0,0L10,0L10,10Z",
    enterD: "M0,10L10,10L10,10Z",
    series: {keys: [1], top: xy([0, 0]), base: xy([0, 10])},
    paint: {},
  };
  assert.strictEqual(collapse(node).series, undefined);
});

it("CanvasRenderer starts an interrupting draw from the frame it last painted", async () => {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  const rect = x => ({
    width: 200,
    height: 100,
    root: {
      type: "group",
      key: "root",
      children: [
        {type: "rect", key: "a", x, y: 0, width: 10, height: 10, paint: {}},
      ],
    },
  });
  renderer.drawScene(rect(0));
  await new Promise(resolve => {
    renderer.drawScene(rect(100), {
      duration: 400,
      onFrame: t => {
        if (t > 0.2 && t < 0.8) resolve();
      },
    });
  });
  const handle = renderer.drawScene(rect(50), {duration: 30});
  const start = renderer._scene.root.children[0].x;
  assert.ok(start > 0 && start < 100, `starts mid-tween (x ${start})`);
  await handle.finished;
  assert.strictEqual(renderer._scene.root.children[0].x, 50);
  renderer.destroy();
});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

it("SvgRenderer tweens a series path by key and resumes an interrupted tween", async () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  const draw = (series, opts) =>
    renderer.drawScene(
      {
        width: 200,
        height: 100,
        root: {
          type: "group",
          key: "root",
          children: [
            {
              type: "path",
              key: "line",
              d: seriesPath(series),
              series,
              paint: {},
            },
          ],
        },
      },
      opts,
    );
  const a = {keys: [1, 2], top: xy([0, 50], [100, 50])};
  draw(a);
  const el = document.querySelector('[data-key="line"]');
  assert.strictEqual(el.__d3plusSeries__, a, "stashes the drawn series");

  const b = {keys: [1, 2, 3], top: xy([0, 50], [50, 50], [100, 0])};
  draw(b, {duration: 400});
  await wait(150);
  const mid = el.__d3plusSeries__;
  assert.deepStrictEqual(mid.keys, [1, 2, 3], "the frame carries every key");
  assert.ok(mid.top[1][0] < 100 && mid.top[1][0] > 50, "point 2 slides left");
  assert.strictEqual(el.getAttribute("d"), seriesPath(mid));

  // Interrupt: the next tween starts from the frame drawn, not from `b`.
  const c = {keys: [2, 3, 4], top: xy([0, 50], [50, 0], [100, 50])};
  draw(c, {duration: 400});
  await wait(20);
  const resumed = el.__d3plusSeries__;
  assert.deepStrictEqual(resumed.keys, [1, 2, 3, 4]);
  assert.ok(resumed.top[1][0] > 25, `point 2 continues from mid-tween`);
  await wait(500);
  assert.strictEqual(el.getAttribute("d"), seriesPath(c));
  assert.strictEqual(el.__d3plusSeries__, c);
  renderer.destroy();
});

it("seriesPath draws a point sitting on the one before it once", () => {
  const top = xy([0, 0], [10, 5], [10, 5]);
  const d = seriesPath({keys: [1, 2, 3], top, curve: "monotoneX"});
  assert.ok(!d.includes("NaN"), d);
  assert.strictEqual(
    d,
    seriesPath({keys: [1, 2], top: xy([0, 0], [10, 5]), curve: "monotoneX"}),
  );
});
