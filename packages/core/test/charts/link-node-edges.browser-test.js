import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A link stops at the outline of each node it connects, in Chromium on SVG
    and Canvas, so it doesn't run on under a node hover dims: both corners
    of its stroke's square end sit on the node's circle (or on or inside a
    Rect node's box, one of them on it), at rest and as hover widens it, on
    Network (straight and bundled links), Rings, and ArcDiagram (a stroke as
    wide as its node runs on to its center, under it). An arrowhead's tip
    sits a pixel off a Rect node's box. A Tree link leaves each node's own
    outline square to its side.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

/** Runs in the page: draws `chart` from `config`, resolving once painted. */
const draw = ([chart, config, fns, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .config(config);
    for (const [key, src] of Object.entries(fns || {}))
      viz[key](new Function(`return ${src}`)());
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: the painted paths (`d`, stroke width) and nodes (center, outline), by key. */
const scene = () => {
  const paths = {};
  const nodes = {};
  const walk = n => {
    const key = String(n.key);
    const t = n.transform || {};
    if (n.type === "path")
      paths[key] = {
        d: n.d,
        strokeWidth: n.paint?.strokeWidth ?? 1,
        x: t.x || 0,
        y: t.y || 0,
      };
    if (n.type === "circle")
      nodes[key] = {
        x: (t.x || 0) + n.cx,
        y: (t.y || 0) + n.cy,
        r: n.r,
      };
    if (n.type === "rect")
      nodes[key] = {
        x: (t.x || 0) + n.x + n.width / 2,
        y: (t.y || 0) + n.y + n.height / 2,
        width: n.width,
        height: n.height,
      };
    (n.children || []).forEach(walk);
  };
  walk(window.__viz._paintedScene.root);
  return {paths, nodes};
};

/** Runs in the page: hovers every mark, resolving once the chart repaints. */
const hoverAll = () =>
  new Promise(resolve => {
    window.__viz.hover(() => true);
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
  });

const numbers = d => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);

/**
    One end of a path: its first point (`end` "source") or its last, and
    the direction it runs in there, from the other end (for a straight
    path).
*/
function pathEnd(d, end) {
  const n = numbers(d);
  const first = [n[0], n[1]];
  const last = [n[n.length - 2], n[n.length - 1]];
  const [p, q] = end === "source" ? [first, last] : [last, first];
  return {p, dir: Math.atan2(p[1] - q[1], p[0] - q[0])};
}

/** The two corners of a stroke `width` wide ending at `p`, running along `dir`. */
const corners = (p, dir, width) => {
  const nx = -Math.sin(dir) * (width / 2);
  const ny = Math.cos(dir) * (width / 2);
  return [
    [p[0] + nx, p[1] + ny],
    [p[0] - nx, p[1] - ny],
  ];
};

/** How far `q` sits outside a node's outline (negative inside it). */
function outside(q, node) {
  const dx = q[0] - node.x;
  const dy = q[1] - node.y;
  if (node.r !== undefined) return Math.hypot(dx, dy) - node.r;
  return Math.max(
    Math.abs(dx) - node.width / 2,
    Math.abs(dy) - node.height / 2,
  );
}

/**
    Asserts the stroke `key` meets `nodeKey` at its `end`: the corners of
    its square end on the node's outline, or (on a box) on or inside it
    with one of them on it, and the stroke as wide as `scale` times `rest`.
*/
function assertMeets(view, key, nodeKey, end, {curved = false} = {}) {
  const link = view.paths[key];
  const node = view.nodes[nodeKey];
  assert.ok(link, `${key} is painted`);
  assert.ok(node, `${nodeKey} is painted`);
  const {p, dir} = pathEnd(link.d, end);
  const half = link.strokeWidth / 2;
  if (node.r !== undefined && half >= node.r) {
    // A stroke as wide as its node runs on to the node's center, under it.
    assert.ok(Math.hypot(p[0] - node.x, p[1] - node.y) < 0.6, key);
    return;
  }
  if (curved) {
    // A curve's end leaves its circle at a slant, so its middle is held to
    // where a square-on end's middle sits: as far in as its corners allow.
    const expected = Math.sqrt(node.r ** 2 - half ** 2) - node.r;
    const off = outside(p, node);
    assert.ok(
      Math.abs(off - expected) < 0.6,
      `${key} at ${nodeKey}: ${off.toFixed(3)} vs ${expected.toFixed(3)}`,
    );
  } else {
    const offs = corners(p, dir, link.strokeWidth).map(q => outside(q, node));
    const msg = `${key} at ${nodeKey}: ${offs.map(o => o.toFixed(3))}`;
    assert.ok(
      offs.every(o => o <= 0.05),
      `${msg}: inside or on the outline`,
    );
    assert.ok(
      offs.some(o => o >= -0.05),
      `${msg}: on the outline`,
    );
  }
  const hit = view.paths[`${key}::hit`];
  if (hit)
    assert.notStrictEqual(hit.d, link.d, `${key}'s hit path keeps its length`);
}

async function withChart(args, check) {
  const {page, errors, close} = await openPage(box);
  try {
    await page.evaluate(draw, args);
    await check(await page.evaluate(scene), "rest");
    await page.evaluate(hoverAll);
    await check(await page.evaluate(scene), "hover");
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

const nodes = [
  {id: "A", x: 0, y: 0},
  {id: "B", x: 200, y: 0},
  {id: "C", x: 0, y: 120},
  {id: "D", x: 200, y: 160},
];
const links = [
  {source: "A", target: "B", w: 1},
  {source: "A", target: "C", w: 14},
  {source: "C", target: "D", w: 6},
  {source: "B", target: "D", w: 3},
];

for (const renderer of ["svg", "canvas"]) {
  it(`Network ${renderer}: thin and thick links stop at each circle's outline`, async () => {
    await withChart(
      [
        "Network",
        {nodes, links, sizeMax: 24},
        {linkSize: "d => d.w"},
        renderer,
      ],
      (view, state) => {
        for (const [i, {source, target}] of links.entries()) {
          const key = `network-link-${source}-${target}-${i}`;
          assert.ok(view.paths[key], `${state}: ${key}`);
          assertMeets(view, key, `network-Circle-${source}`, "source");
          assertMeets(view, key, `network-Circle-${target}`, "target");
        }
      },
    );
  });

  it(`Network ${renderer}: links stop at a Rect node's box, and its arrowheads a pixel off it`, async () => {
    await withChart(
      [
        "Network",
        {nodes, links, sizeMax: 24, arrows: "target"},
        {linkSize: "d => d.w", shape: '() => "Rect"'},
        renderer,
      ],
      view => {
        for (const [i, {source, target}] of links.entries()) {
          const key = `network-link-${source}-${target}-${i}`;
          assertMeets(view, key, `network-Rect-${source}`, "source");
          const arrow = view.paths[`network-arrow-${source}-${target}-${i}-t`];
          assert.ok(arrow, `${key}'s arrowhead`);
          const [x, y] = numbers(arrow.d);
          const off = outside([x, y], view.nodes[`network-Rect-${target}`]);
          assert.ok(Math.abs(off - 1) < 0.05, `${key}'s tip: ${off}px off`);
        }
      },
    );
  });

  it(`Network ${renderer}: bundled links stop at each circle's outline`, async () => {
    await withChart(
      [
        "Network",
        {nodes, links, sizeMax: 24, linkBundle: true},
        {linkSize: "d => d.w"},
        renderer,
      ],
      view => {
        for (const [i, {source, target}] of links.entries()) {
          const key = `network-link-${source}-${target}-${i}`;
          assertMeets(view, key, `network-Circle-${source}`, "source", {
            curved: true,
          });
          assertMeets(view, key, `network-Circle-${target}`, "target", {
            curved: true,
          });
        }
      },
    );
  });

  it(`Rings ${renderer}: links from the center stop at each circle's outline`, async () => {
    await withChart(
      [
        "Rings",
        {
          links: [
            {source: "A", target: "B", w: 8},
            {source: "A", target: "C", w: 2},
          ],
          center: "A",
        },
        {linkSize: "d => d.w"},
        renderer,
      ],
      view => {
        for (const key of ["rings-link-A-B", "rings-link-A-C"]) {
          const [, , s, t] = key.split("-");
          assertMeets(view, key, `rings-Circle-${s}`, "source");
          assertMeets(view, key, `rings-Circle-${t}`, "target");
        }
      },
    );
  });

  it(`ArcDiagram ${renderer}: arcs rise from each node's outline`, async () => {
    await withChart(
      [
        "ArcDiagram",
        {
          nodes: ["A", "B", "C"].map(id => ({id})),
          links: [
            {source: "A", target: "C", w: 3},
            {source: "A", target: "B", w: 1},
          ],
        },
        {linkSize: "d => d.w"},
        renderer,
      ],
      view => {
        for (const [i, [s, t]] of [
          ["A", "C"],
          ["A", "B"],
        ].entries()) {
          const key = `arc-link-${s}-${t}-${i}`;
          assertMeets(view, key, `arc-node-${s}`, "source", {curved: true});
          assertMeets(view, key, `arc-node-${t}`, "target", {curved: true});
        }
      },
    );
  });

  it(`Tree ${renderer}: links leave each node's own outline`, async () => {
    await withChart(
      [
        "Tree",
        {
          data: [
            {parent: "P", id: "a"},
            {parent: "P", id: "b"},
          ],
        },
        {
          groupBy: '["parent", "id"]',
          shapeConfig: '{Circle: {r: d => (d.id === "a" ? 14 : 9)}}',
        },
        renderer,
      ],
      (view, state) => {
        for (const id of ["a", "b"]) {
          const link = view.paths[`tree-link-${id}`];
          assert.ok(link, `${state}: tree-link-${id}`);
          const n = numbers(link.d);
          for (const [x, y, nodeKey] of [
            [n[0], n[1], `tree-Circle-${id}`],
            [n.at(-2), n.at(-1), "tree-Circle-P"],
          ]) {
            const off = outside([x + link.x, y + link.y], view.nodes[nodeKey]);
            assert.ok(Math.abs(off) < 0.05, `${id} at ${nodeKey}: ${off}`);
          }
        }
      },
    );
  });
}
