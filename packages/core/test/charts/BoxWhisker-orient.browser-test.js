import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A BoxWhisker's boxes run along its value axis: with `discrete: "y"` and
    no `shapeConfig.Box.orient`, they lie horizontal, exactly as they do
    with `orient: "horizontal"` set, from raw observations or summary rows,
    on SVG and Canvas. An `orient` set explicitly still wins.
*/

const observations = {
  alpha: [300, 150, 160, 140, 20, 180, 40, 170, 125, 74, 80, 900],
  beta: [180, 30, 120, 50, 140, 115],
  gamma: [95, 110, 120, 135, 150, 160, 175, 210, 230, -60],
};
const rows = Object.entries(observations).flatMap(([id, values]) =>
  values.map((value, n) => ({id, n, value})),
);
const summary = [
  {id: "alpha", min: 20, q1: 78.5, med: 145, q3: 172.5, max: 313.5},
  {id: "beta", min: 30, q1: 66.25, med: 117.5, q3: 135, max: 180},
  {id: "gamma", min: 24.375, q1: 112.5, med: 142.5, q3: 171.25, max: 230},
];

/**
    Runs in the page: draws a BoxWhisker from `config` and reports each box
    part's geometry, by key, and each Box's orient.
*/
const draw = async ({config, renderer}) => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const viz = new window.d3plus.BoxWhisker()
    .select(el)
    .renderer(renderer)
    .detectVisible(false)
    .duration(0)
    .width(600)
    .height(400)
    .legend(false)
    .config(config);
  await new Promise(r => viz.render(r));
  const parts = {};
  const walk = list => {
    for (const n of list || []) {
      if (n.type === "group") walk(n.children);
      else if (typeof n.key === "string" && !n.key.endsWith("::hit")) {
        const t = n.transform || {};
        parts[n.key] = [t.x ?? n.x, t.y ?? n.y, n.width, n.height].map(v =>
          v === undefined ? null : Math.round(v * 100) / 100,
        );
      }
    }
  };
  walk(viz._chartScene);
  el.remove();
  return parts;
};

const raw = {data: rows, groupBy: ["id", "n"], x: "value", y: "id"};
const stats = {
  data: summary,
  y: "id",
  boxMin: "min",
  boxQ1: "q1",
  boxMedian: "med",
  boxQ3: "q3",
  boxMax: "max",
};

/** The box rects' widths and heights, by category. */
const boxSizes = parts =>
  Object.fromEntries(
    Object.entries(parts)
      .filter(([key]) => /(alpha|beta|gamma)-box$/.test(key))
      .map(([key, [, , w, h]]) => [key.match(/(alpha|beta|gamma)/)[1], [w, h]]),
  );

for (const renderer of ["svg", "canvas"]) {
  it(`BoxWhisker [${renderer}]: discrete "y" lays the boxes horizontal without an orient`, async () => {
    for (const [name, base] of [
      ["raw", raw],
      ["precomputed", stats],
    ]) {
      const config = {...base, discrete: "y"};
      const inferred = await render("", draw, {config, renderer});
      const set = await render("", draw, {
        config: {...config, shapeConfig: {Box: {orient: "horizontal"}}},
        renderer,
      });
      assert.ok(Object.keys(inferred).length > 0, `${name}: boxes drawn`);
      assert.deepStrictEqual(inferred, set, `${name}: as orient "horizontal"`);
      const sizes = boxSizes(inferred);
      assert.deepStrictEqual(Object.keys(sizes).sort(), [
        "alpha",
        "beta",
        "gamma",
      ]);
      for (const [id, [w, h]] of Object.entries(sizes))
        assert.ok(w > 0 && h > 0, `${name} ${id}: ${w}×${h}`);
    }
  });

  it(`BoxWhisker [${renderer}]: an orient set explicitly still wins`, async () => {
    const config = {...raw, discrete: "y"};
    const vertical = await render("", draw, {
      config: {...config, shapeConfig: {Box: {orient: "vertical"}}},
      renderer,
    });
    const inferred = await render("", draw, {config, renderer});
    assert.notDeepStrictEqual(vertical, inferred);
    // Discrete "x" stays vertical.
    const x = {...raw, x: "id", y: "value"};
    const upright = await render("", draw, {config: x, renderer});
    const set = await render("", draw, {
      config: {...x, shapeConfig: {Box: {orient: "vertical"}}},
      renderer,
    });
    assert.deepStrictEqual(upright, set);
  });
}
