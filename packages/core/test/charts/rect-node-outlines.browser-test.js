import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Links and loops meet a Rect node's real box, in Chromium on SVG and
    Canvas: on Rings, a box from `shapeConfig`'s Rect `width` and `height`
    accessors, turned along its spoke (straight links from the center,
    curved links between rings, and loops); on Network and ArcDiagram, a
    loop's ends sit on the node's box rather than the circle inside it.
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

/** Runs in the page: the painted paths and Rect nodes (center, size, turn), by key. */
const scene = () => {
  const paths = {};
  const rects = {};
  const texts = [];
  const walk = (n, ox, oy) => {
    const t = n.transform || {};
    const x = ox + (t.x || 0);
    const y = oy + (t.y || 0);
    const key = String(n.key);
    if (n.type === "path")
      paths[key] = {d: n.d, x, y, strokeWidth: n.paint?.strokeWidth ?? 1};
    if (n.type === "text") texts.push({key, size: n.font?.size});
    if (n.type === "rect")
      rects[key] = {
        x: x + n.x + n.width / 2,
        y: y + n.y + n.height / 2,
        width: n.width,
        height: n.height,
        rotate: t.rotate || 0,
      };
    (n.children || []).forEach(c => walk(c, x, y));
  };
  walk(window.__viz._paintedScene.root, 0, 0);
  return {paths, rects, texts};
};

const numbers = d => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);

/** A path's first and last points, offset by its transform. */
function ends(path) {
  const n = numbers(path.d);
  return [
    [n[0] + path.x, n[1] + path.y],
    [n[n.length - 2] + path.x, n[n.length - 1] + path.y],
  ];
}

/** How far `q` sits outside a (turned) box (negative inside it). */
function outside(q, node) {
  const a = (-node.rotate * Math.PI) / 180;
  const dx = q[0] - node.x;
  const dy = q[1] - node.y;
  const lx = dx * Math.cos(a) - dy * Math.sin(a);
  const ly = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.max(
    Math.abs(lx) - node.width / 2,
    Math.abs(ly) - node.height / 2,
  );
}

/** Asserts `q` sits on `node`'s box. */
function assertOn(q, node, msg) {
  const off = outside(q, node);
  assert.ok(Math.abs(off) < 0.1, `${msg}: ${off.toFixed(3)} off the box`);
}

/**
    Asserts a straight stroke's square end at `p` (running from `from`)
    meets the box: both corners on or inside it, one of them on it.
*/
function assertStraightMeets(p, from, width, node, msg) {
  const dir = Math.atan2(p[1] - from[1], p[0] - from[0]);
  const nx = -Math.sin(dir) * (width / 2);
  const ny = Math.cos(dir) * (width / 2);
  const offs = [
    [p[0] + nx, p[1] + ny],
    [p[0] - nx, p[1] - ny],
  ].map(q => outside(q, node));
  const text = `${msg}: ${offs.map(o => o.toFixed(3))}`;
  assert.ok(
    offs.every(o => o <= 0.1),
    `${text}: inside or on the box`,
  );
  assert.ok(
    offs.some(o => o >= -0.1),
    `${text}: on the box`,
  );
}

async function withChart(args, check) {
  const {page, errors, close} = await openPage(box);
  try {
    await page.evaluate(draw, args);
    check(await page.evaluate(scene));
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

const ringsLinks = [
  {source: "A", target: "B"},
  {source: "A", target: "C"},
  {source: "A", target: "E"},
  {source: "B", target: "D"},
  {source: "C", target: "F"},
  {source: "D", target: "F"},
  {source: "B", target: "B"},
  {source: "A", target: "A"},
];

for (const renderer of ["svg", "canvas"]) {
  it(`Rings ${renderer}: links and loops meet each Rect node's turned box`, async () => {
    await withChart(
      [
        "Rings",
        {links: ringsLinks, center: "A", hops: 2},
        {
          shape: '() => "Rect"',
          shapeConfig: `({Rect: {width: d => d.id === "B" ? 48 : d.id === "A" ? 60 : 36, height: d => d.id === "A" ? 30 : 12}})`,
        },
        renderer,
      ],
      ({paths, rects, texts}) => {
        const node = id => rects[`rings-Rect-${id}`];
        // The center's label fits inside its box.
        const center = texts.filter(t => t.key.startsWith("rings-label-A_"));
        assert.ok(center.length, "the center is labeled");
        for (const t of center)
          assert.ok(t.size > 0 && t.size <= 30, `center label at ${t.size}px`);
        assert.strictEqual(node("B").width, 48, "B's width accessor");
        assert.strictEqual(node("C").width, 36, "C's width accessor");
        assert.strictEqual(node("C").height, 12, "C's height");
        assert.ok(node("C").rotate, "ring nodes turn along their spokes");
        const links = Object.entries(paths).filter(
          ([key]) => key.startsWith("rings-link-") && !key.endsWith("::hit"),
        );
        let straight = 0;
        let curved = 0;
        let loops = 0;
        for (const [key, path] of links) {
          const [, s, t] = key.match(/^rings-link-(\w)-(\w)/);
          const [p0, p1] = ends(path);
          if (s === t) {
            loops++;
            assertOn(p0, node(s), `${key} leaves`);
            assertOn(p1, node(t), `${key} comes back`);
          } else if (/C/.test(path.d)) {
            curved++;
            assertOn(p0, node(s), `${key} at ${s}`);
            assertOn(p1, node(t), `${key} at ${t}`);
          } else {
            straight++;
            assertStraightMeets(
              p0,
              p1,
              path.strokeWidth,
              node(s),
              `${key} ${s}`,
            );
            assertStraightMeets(
              p1,
              p0,
              path.strokeWidth,
              node(t),
              `${key} ${t}`,
            );
          }
        }
        assert.ok(straight >= 3, `${straight} links from the center`);
        assert.ok(curved >= 2, `${curved} curved links`);
        assert.strictEqual(loops, 2, "both loops draw");
      },
    );
  });

  it(`Network ${renderer}: a loop on a Rect node leaves and returns on its box`, async () => {
    // A's neighbors sit right and below, so its loop points up and to the left, at a corner.
    await withChart(
      [
        "Network",
        {
          nodes: [
            {id: "A", x: 0, y: 0},
            {id: "B", x: 200, y: 0},
            {id: "C", x: 0, y: 160},
          ],
          links: [
            {source: "A", target: "B"},
            {source: "A", target: "C"},
            {source: "A", target: "A"},
          ],
          sizeMax: 24,
        },
        {shape: '() => "Rect"'},
        renderer,
      ],
      ({paths, rects}) => {
        const loop = paths["network-link-A-A-2"];
        assert.ok(loop, "the loop draws");
        const [p0, p1] = ends(loop);
        const a = rects["network-Rect-A"];
        assertOn(p0, a, "leaves");
        assertOn(p1, a, "comes back");
      },
    );
  });

  it(`ArcDiagram ${renderer}: a loop on a Rect node leaves and returns on its box`, async () => {
    await withChart(
      [
        "ArcDiagram",
        {
          links: [
            {source: "A", target: "B"},
            {source: "B", target: "C"},
            {source: "B", target: "B"},
          ],
          sizeMin: 12,
        },
        {shape: '() => "Rect"'},
        renderer,
      ],
      ({paths, rects}) => {
        const key = Object.keys(paths).find(
          k => k.startsWith("arc-link-B-B") && !k.endsWith("::hit"),
        );
        assert.ok(key, "the loop draws");
        const [p0, p1] = ends(paths[key]);
        const b = rects["arc-node-B"];
        assertOn(p0, b, "leaves");
        assertOn(p1, b, "comes back");
      },
    );
  });
}
