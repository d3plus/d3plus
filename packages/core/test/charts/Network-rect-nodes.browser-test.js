import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart} from "~test/browser/helpers.js";

/**
    A Network's Rect nodes draw as `shapeConfig`'s Rect `width` and `height`
    (a 2r square when unset), inside the chart, with each straight link
    ending on its nodes' boxes, on both backends.
*/

const NODES = [
  {id: "alpha", x: 0, y: 0, w: 80},
  {id: "beta", x: 1, y: 0, w: 40},
  {id: "gamma", x: 0.5, y: 1, w: 60},
];
const LINKS = [
  {source: "alpha", target: "beta"},
  {source: "beta", target: "gamma"},
];

/** Renders a Rect-node Network with `shapeConfig` and reports its node boxes, link ends, and chart size. */
const probe = (shapeConfig, renderer) =>
  probeChart(
    `(lib, data) => new lib.Network().nodes(data.nodes).links(data.links)
      .shape("Rect").shapeConfig(data.shapeConfig).legend(false)`,
    viz => {
      const boxes = {},
        links = [];
      const walk = nodes =>
        nodes.forEach(n => {
          const key = String(n.key);
          const node = key.match(/^network-Rect-(\w+)$/);
          if (node && n.type === "rect")
            boxes[node[1]] = {
              x: n.x,
              y: n.y,
              width: n.width,
              height: n.height,
            };
          const link = key.match(/^network-link-(\w+)-(\w+)-\d+$/);
          if (link && n.type === "path") {
            const v = String(n.d)
              .match(/-?\d+(\.\d+)?(e-?\d+)?/g)
              .map(Number);
            links.push({
              source: link[1],
              target: link[2],
              ends: [
                [v[0], v[1]],
                [v[v.length - 2], v[v.length - 1]],
              ],
            });
          }
          if (n.children) walk(n.children);
        });
      walk(viz._chartScene);
      return {boxes, links, width: viz.schema.width, height: viz.schema.height};
    },
    {data: {nodes: NODES, links: LINKS, shapeConfig}, renderer},
  );

/** Whether `[x, y]` sits on `box`'s outline, within `e` pixels. */
function onOutline([x, y], box, e = 0.5) {
  const inside =
    x >= box.x - e &&
    x <= box.x + box.width + e &&
    y >= box.y - e &&
    y <= box.y + box.height + e;
  const edge =
    Math.abs(x - box.x) <= e ||
    Math.abs(x - box.x - box.width) <= e ||
    Math.abs(y - box.y) <= e ||
    Math.abs(y - box.y - box.height) <= e;
  return inside && edge;
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: Rect nodes draw at shapeConfig's width and height`, async () => {
    // An accessor can't travel as data, so this chart is built in the page.
    const sized = await probeChart(
      `(lib, data) => new lib.Network().nodes(data.nodes).links(data.links)
        .shape("Rect").shapeConfig({Rect: {width: d => d.w, height: 24}})
        .legend(false)`,
      viz => {
        const boxes = {};
        const walk = nodes =>
          nodes.forEach(n => {
            const m = String(n.key).match(/^network-Rect-(\w+)$/);
            if (m && n.type === "rect") boxes[m[1]] = [n.width, n.height];
            if (n.children) walk(n.children);
          });
        walk(viz._chartScene);
        return boxes;
      },
      {data: {nodes: NODES, links: LINKS}, renderer},
    );
    assert.deepStrictEqual(sized, {
      alpha: [80, 24],
      beta: [40, 24],
      gamma: [60, 24],
    });
  });

  it(`${renderer}: links end on the Rect nodes' boxes, which stay in the chart`, async () => {
    const out = await probe({Rect: {width: 70, height: 20}}, renderer);
    for (const box of Object.values(out.boxes)) {
      assert.strictEqual(box.width, 70);
      assert.strictEqual(box.height, 20);
      assert.ok(box.x >= 0 && box.x + box.width <= out.width, "inside across");
      assert.ok(box.y >= 0 && box.y + box.height <= out.height, "inside down");
    }
    assert.strictEqual(out.links.length, 2);
    for (const link of out.links) {
      const [start, end] = link.ends;
      assert.ok(
        onOutline(start, out.boxes[link.source]),
        `${link.source}→${link.target} starts on ${link.source}'s box: ${start}`,
      );
      assert.ok(
        onOutline(end, out.boxes[link.target]),
        `${link.source}→${link.target} ends on ${link.target}'s box: ${end}`,
      );
    }
  });

  it(`${renderer}: an unsized Rect node is a square around its circle`, async () => {
    const out = await probe({}, renderer);
    for (const box of Object.values(out.boxes))
      assert.strictEqual(box.width, box.height);
  });
}

/** Every Rect node's drawn box, in surface pixels, and the surface's size, for a 300×200 chart of big `size` boxes. */
const bigBoxes = (layout, size, renderer) =>
  probeChart(
    `(lib, data) => new lib.Network().nodes(data.nodes).links(data.links)
      .shape("Rect").shapeConfig({Rect: {width: data.size[0], height: data.size[1]}})
      .layout(data.layout).legend(false)`,
    viz => {
      const t = viz._chartTransform || {x: 0, y: 0};
      const boxes = [];
      const walk = nodes =>
        nodes.forEach(n => {
          if (/^network-Rect-/.test(String(n.key)) && n.type === "rect")
            boxes.push({
              id: String(n.key),
              x0: t.x + n.x,
              y0: t.y + n.y,
              x1: t.x + n.x + n.width,
              y1: t.y + n.y + n.height,
            });
          if (n.children) walk(n.children);
        });
      walk(viz._chartScene);
      const surface = document
        .querySelector("#viz svg, #viz canvas")
        .getBoundingClientRect();
      return {boxes, width: surface.width, height: surface.height};
    },
    {
      data: {
        nodes: [
          {id: "alpha", x: 0, y: 0},
          {id: "beta", x: 1, y: 0.2},
          {id: "gamma", x: 2, y: 0},
          {id: "delta", x: 3, y: 0.2},
        ],
        links: [
          {source: "alpha", target: "beta"},
          {source: "beta", target: "delta"},
          {source: "delta", target: "gamma"},
          {source: "gamma", target: "alpha"},
        ],
        layout,
        size,
      },
      renderer,
      html: '<div id="viz" style="width:300px;height:200px"></div>',
    },
  );

for (const renderer of ["svg", "canvas"])
  for (const [layout, size] of [
    ["force", [140, 30]],
    ["circle", [240, 60]],
  ])
    it(`${renderer}: big fixed-size Rect nodes stay inside a small chart (${layout} layout)`, async () => {
      const out = await bigBoxes(layout, size, renderer);
      assert.strictEqual(out.boxes.length, 4);
      for (const b of out.boxes) {
        assert.strictEqual(
          Math.round(b.x1 - b.x0),
          size[0],
          `${b.id} keeps its width`,
        );
        assert.ok(
          b.x0 >= -0.5 && b.x1 <= out.width + 0.5,
          `${b.id} [${b.x0}, ${b.x1}] inside ${out.width} across`,
        );
        assert.ok(
          b.y0 >= -0.5 && b.y1 <= out.height + 0.5,
          `${b.id} [${b.y0}, ${b.y1}] inside ${out.height} down`,
        );
      }
    });
