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
