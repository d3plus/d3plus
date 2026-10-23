import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A BoxWhisker's boxes fill with the chart's color, from `color()` or
    `shapeConfig.fill`, so they match their legend swatches; outliers take the
    same color, and the median line contrasts with it. `shapeConfig.Box.
    rectConfig.fill` still sets the box fill outright. On SVG and Canvas.
*/

// Runs in the page: draws a BoxWhisker with `config` (and, from `fillBy`, a
// `shapeConfig.fill` by id) and reports each box's scene paint (fill, stroke,
// median and outlier fills) and legend swatch fills, plus what each box looks
// like on screen at rest, while alpha is hovered, and while alpha is
// highlighted: the SVG node's fill and opacity, or the canvas color painted
// inside it.
const draw = async ({config, fillBy, renderer}) => {
  const el = document.querySelector("#viz");
  const rows = [];
  ["alpha", "beta", "gamma"].forEach((id, k) =>
    [300, 150, 155, 145, 20, 180, 40, 170, 125, 74, 80].forEach((v, n) =>
      rows.push({id, region: k === 1 ? "east" : "west", value: v + k * 10, n}),
    ),
  );
  const viz = new window.d3plus.BoxWhisker()
    .select(el)
    .renderer(renderer)
    .detectVisible(false)
    .duration(0)
    .width(600)
    .height(400)
    .data(rows)
    .groupBy(["id", "n"])
    .x("id")
    .y("value")
    .config(config);
  if (fillBy) viz.config({shapeConfig: {fill: d => fillBy[d.id]}});
  await new Promise(r => viz.render(r));
  const ids = ["alpha", "beta", "gamma"];

  const nodes = {};
  const walk = list => {
    for (const n of list || []) {
      if (n.type === "group") walk(n.children);
      else if (n.key) nodes[n.key] = n;
    }
  };
  walk(viz._chartScene);
  const keyOf = part => Object.keys(nodes).find(k => k.endsWith(part));
  const paint = part => nodes[keyOf(part)]?.paint ?? {};
  const boxes = Object.fromEntries(
    ids.map(id => [
      id,
      {
        box: {fill: paint(`${id}-box`).fill, stroke: paint(`${id}-box`).stroke},
        median: paint(`${id}-median`).fill,
        outlier: paint(`${id}-outlier-0`).fill,
      },
    ]),
  );

  const legend = {};
  const swatches = list => {
    for (const n of list || []) {
      if (n.type === "group") swatches(n.children);
      else if (n.type === "rect" && /_1_$/.test(n.key))
        legend[n.key.replace(/_1_$/, "")] = n.paint?.fill;
    }
  };
  swatches([viz._legendClass.toScene()]);

  // What each box looks like on screen: its SVG node's fill and opacity, or
  // the color painted most often down a column just inside its left edge.
  const canvas = el.querySelector("canvas.d3plus-render-canvas");
  const looks = () =>
    Object.fromEntries(
      ids.map(id => {
        const key = keyOf(`${id}-box`);
        if (!canvas) {
          const dom = el.querySelector(`[data-key='${key}']`);
          let opacity = 1;
          for (let n = dom; n && n !== el; n = n.parentNode)
            opacity *= Number(n.getAttribute("opacity") ?? 1);
          return [id, {fill: dom.getAttribute("fill"), opacity}];
        }
        const n = nodes[key];
        const at = n.transform?.x !== undefined ? n.transform : n;
        const ctx = canvas.getContext("2d");
        const host = canvas.getBoundingClientRect();
        const scale = canvas.width / host.width;
        const x0 = at.x - n.width / 2;
        const y0 = at.y - n.height / 2;
        const counts = {};
        for (let y = y0 + 3; y < y0 + n.height - 3; y++) {
          const px = ctx.getImageData(
            Math.round((x0 + 4) * scale),
            Math.round(y * scale),
            1,
            1,
          ).data;
          const c = `rgb(${px[0]}, ${px[1]}, ${px[2]})`;
          counts[c] = (counts[c] || 0) + 1;
        }
        return [id, Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]];
      }),
    );
  const frames = async () => {
    for (let i = 0; i < 3; i++)
      await new Promise(r => requestAnimationFrame(() => r()));
  };

  const rest = looks();
  viz.hover(d => d.id === "alpha");
  await frames();
  const hovered = looks();
  viz.hover(false);
  viz.highlight(d => d.id === "alpha");
  await frames();
  const highlighted = looks();
  return {boxes, legend, rest, hovered, highlighted};
};

const run = (config, renderer, fillBy) =>
  render("<div id='viz' style='width:600px;height:400px'></div>", draw, {
    config,
    fillBy,
    renderer,
  });

/** "#rrggbb" or "rgb(…)" as "rgb(r, g, b)". */
const rgb = c => {
  const m = /^#(..)(..)(..)$/.exec(c);
  return m
    ? `rgb(${m
        .slice(1)
        .map(h => parseInt(h, 16))
        .join(", ")})`
    : c;
};

/** On screen, `look` shows the box's `fill` at full strength. */
const showsFill = (look, fill) =>
  typeof look === "string"
    ? look === rgb(fill)
    : look.fill === fill && look.opacity === 1;

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: boxes and outliers fill with the default colors, matching the legend`, async function () {
    const {boxes, legend, rest} = await run({}, renderer);
    const fills = ["alpha", "beta", "gamma"].map(id => boxes[id].box.fill);
    assert.strictEqual(new Set(fills).size, 3, "each box has its own color");
    for (const id of ["alpha", "beta", "gamma"]) {
      const {box, median, outlier} = boxes[id];
      assert.notStrictEqual(box.fill, "white");
      assert.notStrictEqual(
        box.stroke,
        "black",
        "the outline is a shade of the fill",
      );
      assert.strictEqual(outlier, box.fill, `${id}'s outliers match its box`);
      assert.strictEqual(median, "black");
      assert.strictEqual(legend[id], box.fill, `${id}'s swatch matches`);
      assert.ok(showsFill(rest[id], box.fill), `${id} paints its fill`);
    }
  });

  it(`${renderer}: boxes follow color()`, async function () {
    const {boxes, legend} = await run({color: "region"}, renderer);
    assert.strictEqual(boxes.alpha.box.fill, boxes.gamma.box.fill);
    assert.notStrictEqual(boxes.alpha.box.fill, boxes.beta.box.fill);
    assert.strictEqual(legend.west, boxes.alpha.box.fill);
    assert.strictEqual(legend.east, boxes.beta.box.fill);
  });

  it(`${renderer}: boxes follow shapeConfig.fill, with a median that contrasts`, async function () {
    const fillBy = {alpha: "tomato", beta: "#1a1b4b", gamma: "#ffd43b"};
    const {boxes, legend, rest} = await run({}, renderer, fillBy);
    for (const id in fillBy) {
      assert.strictEqual(boxes[id].box.fill, fillBy[id]);
      assert.strictEqual(boxes[id].outlier, fillBy[id]);
      assert.strictEqual(legend[id], fillBy[id]);
    }
    assert.strictEqual(boxes.alpha.median, "black");
    assert.strictEqual(boxes.beta.median, "white", "white over a dark box");
    assert.strictEqual(boxes.gamma.median, "black");
    assert.ok(showsFill(rest.beta, "#1a1b4b"));
  });

  it(`${renderer}: a constant shapeConfig.fill colors every box`, async function () {
    const {boxes} = await run({shapeConfig: {fill: "tomato"}}, renderer);
    for (const id of ["alpha", "beta", "gamma"])
      assert.strictEqual(boxes[id].box.fill, "tomato");
  });

  it(`${renderer}: rectConfig.fill wins over the chart color`, async function () {
    const {boxes, rest} = await run(
      {shapeConfig: {Box: {rectConfig: {fill: "white", stroke: "black"}}}},
      renderer,
    );
    assert.deepStrictEqual(boxes.alpha.box, {fill: "white", stroke: "black"});
    assert.strictEqual(boxes.alpha.median, "black");
    assert.ok(
      showsFill(rest.alpha, "#ffffff") || showsFill(rest.alpha, "white"),
    );
  });

  it(`${renderer}: hover dims and highlight grays the other boxes`, async function () {
    const {boxes, hovered, highlighted} = await run({}, renderer);
    assert.ok(showsFill(hovered.alpha, boxes.alpha.box.fill), "alpha stays");
    assert.ok(!showsFill(hovered.beta, boxes.beta.box.fill), "beta dims");
    assert.ok(
      showsFill(highlighted.alpha, boxes.alpha.box.fill),
      "alpha stays",
    );
    assert.ok(!showsFill(highlighted.beta, boxes.beta.box.fill), "beta grays");
  });
}
