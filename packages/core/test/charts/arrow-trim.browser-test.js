import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A link with an arrowhead stops inside it, in Chromium on SVG and Canvas:
    the square end of the link's painted stroke (both corners) lies within
    the arrowhead's triangle, on Network (straight links and loops), Rings,
    and ArcDiagram, while the link's hit path keeps its full length.
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

/** Runs in the page: each painted path's `d`, stroke, and fill, by key. */
const paths = () => {
  const out = {};
  const walk = n => {
    if (n.type === "path")
      out[String(n.key)] = {
        d: n.d,
        strokeWidth: n.paint?.strokeWidth ?? 1,
        stroke: n.paint?.stroke,
        fill: n.paint?.fill,
      };
    (n.children || []).forEach(walk);
  };
  walk(window.__viz._paintedScene.root);
  return out;
};

const numbers = d => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);

/** Whether `p` lies in the triangle `[a, b, c]`, give or take `eps` pixels. */
function inTriangle(p, [a, b, c], eps = 0.6) {
  const edges = [
    [a, b],
    [b, c],
    [c, a],
  ];
  const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const sign = Math.sign(area);
  return edges.every(([u, v]) => {
    const len = Math.hypot(v[0] - u[0], v[1] - u[1]);
    const cross = (v[0] - u[0]) * (p[1] - u[1]) - (v[1] - u[1]) * (p[0] - u[0]);
    return (sign * cross) / len >= -eps;
  });
}

/**
    Asserts the link `key` ends inside the arrowhead `arrowKey`: the end of
    its path, and both corners of its stroke's square end there.
    @param end Which end of the path the arrow sits at.
*/
function assertEndsInside(
  scene,
  key,
  arrowKey,
  end = "target",
  {curved = false} = {},
) {
  const link = scene[key];
  const arrow = scene[arrowKey];
  assert.ok(link, `${key} is painted`);
  assert.ok(arrow, `${arrowKey} is painted`);
  const tri = [];
  const pts = numbers(arrow.d);
  for (let k = 0; k < 6; k += 2) tri.push([pts[k], pts[k + 1]]);
  const tip = tri[0];
  const base = [(tri[1][0] + tri[2][0]) / 2, (tri[1][1] + tri[2][1]) / 2];
  const axis = [tip[0] - base[0], tip[1] - base[1]];
  const len = Math.hypot(...axis);
  const normal = [-axis[1] / len, axis[0] / len];
  const nums = numbers(link.d);
  const p = end === "target" ? nums.slice(-2) : nums.slice(0, 2);
  if (curved) {
    // On a curved end the stroke's end sits on the head's axis.
    const off = Math.abs(
      (p[0] - tip[0]) * (axis[1] / len) - (p[1] - tip[1]) * (axis[0] / len),
    );
    assert.ok(off < 0.5, `${key}: stroke end ${off.toFixed(2)}px off the axis`);
  }
  const half = link.strokeWidth / 2;
  for (const q of [
    p,
    [p[0] + normal[0] * half, p[1] + normal[1] * half],
    [p[0] - normal[0] * half, p[1] - normal[1] * half],
  ])
    assert.ok(
      inTriangle(q, tri),
      `${key}: stroke end ${q.map(v => v.toFixed(2))} inside ${arrow.d}`,
    );
  const hit = scene[`${key}::hit`];
  if (hit)
    assert.notStrictEqual(hit.d, link.d, `${key}'s hit path keeps its length`);
}

/**
    Runs in the page: sets every mark `hover`ed or `active`, resolving once
    the chart repaints.
*/
const emphasize = kind =>
  new Promise(resolve => {
    window.__viz[kind](() => true);
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
  });

/** An arrowhead's length, from its tip to the middle of its base. */
function arrowLength(arrow) {
  const [tx, ty, ax, ay, bx, by] = numbers(arrow.d);
  return Math.hypot(tx - (ax + bx) / 2, ty - (ay + by) / 2);
}

async function withChart(args, check, kind) {
  const {page, errors, close} = await openPage(box);
  try {
    await page.evaluate(draw, args);
    const rest = await page.evaluate(paths);
    if (kind) await page.evaluate(emphasize, kind);
    await check(kind ? await page.evaluate(paths) : rest, rest);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

const nodes = [
  {id: "A", x: 0, y: 0},
  {id: "B", x: 200, y: 0},
  {id: "C", x: 0, y: 120},
  {id: "D", x: 200, y: 120},
];
const links = [
  {source: "A", target: "B", w: 1},
  {source: "A", target: "C", w: 20},
  {source: "C", target: "D", w: 6},
  {source: "D", target: "D", w: 10},
];

for (const renderer of ["svg", "canvas"]) {
  it(`Network ${renderer}: thin, thick, and looped links stop inside their arrowheads`, async () => {
    await withChart(
      [
        "Network",
        {nodes, links, arrows: "both", sizeMax: 14},
        {linkSize: "d => d.w"},
        renderer,
      ],
      scene => {
        for (const [key, s, t] of [
          ["network-link-A-B-0", "A", "B"],
          ["network-link-A-C-1", "A", "C"],
          ["network-link-C-D-2", "C", "D"],
          ["network-link-D-D-3", "D", "D"],
        ]) {
          const i = key.split("-").pop();
          const curved = s === t;
          assertEndsInside(
            scene,
            key,
            `network-arrow-${s}-${t}-${i}-t`,
            "target",
            {
              curved,
            },
          );
          assertEndsInside(
            scene,
            key,
            `network-arrow-${s}-${t}-${i}-s`,
            "source",
            {curved},
          );
        }
      },
    );
  });

  it(`Rings ${renderer}: straight and curved links stop inside their arrowheads`, async () => {
    await withChart(
      [
        "Rings",
        {
          links: [
            {source: "A", target: "B"},
            {source: "A", target: "C"},
            {source: "B", target: "D"},
          ],
          center: "A",
          arrows: true,
        },
        {},
        renderer,
      ],
      scene => {
        assertEndsInside(scene, "rings-link-A-B", "rings-arrow-A-B-0-t");
        assertEndsInside(
          scene,
          "rings-link-B-D",
          "rings-arrow-t-B-D-2",
          "target",
          {
            curved: true,
          },
        );
      },
    );
  });

  it(`ArcDiagram ${renderer}: arcs and loops stop inside their arrowheads`, async () => {
    await withChart(
      [
        "ArcDiagram",
        {nodes, links, arrows: "both"},
        {linkSize: "d => d.w"},
        renderer,
      ],
      scene => {
        for (const key of [
          "arc-link-A-B-0",
          "arc-link-A-C-1",
          "arc-link-C-D-2",
          "arc-link-D-D-3",
        ]) {
          const prefix = key.replace("arc-link-", "arc-arrow-");
          assertEndsInside(scene, key, `${prefix}-t`, "target", {curved: true});
          assertEndsInside(scene, key, `${prefix}-s`, "source", {curved: true});
        }
      },
    );
  });

  it(`${renderer}: a tight loop and a short arc keep their stroke on the axis of a large head`, async () => {
    await withChart(
      [
        "Network",
        {nodes, links, arrows: "both", arrowSize: 24, sizeMax: 14},
        {linkSize: "d => d.w"},
        renderer,
      ],
      scene => {
        for (const end of ["t", "s"])
          assertEndsInside(
            scene,
            "network-link-D-D-3",
            `network-arrow-D-D-3-${end}`,
            end === "t" ? "target" : "source",
            {curved: true},
          );
      },
    );
    await withChart(
      [
        "ArcDiagram",
        {nodes, links, arrows: "both", arrowSize: 20},
        {linkSize: "d => d.w"},
        renderer,
      ],
      scene => {
        for (const key of ["arc-link-A-B-0", "arc-link-D-D-3"])
          for (const end of ["t", "s"])
            assertEndsInside(
              scene,
              key,
              `${key.replace("arc-link-", "arc-arrow-")}-${end}`,
              end === "t" ? "target" : "source",
              {curved: true},
            );
      },
    );
  });

  for (const [kind, width] of [
    ["hover", 2],
    ["active", 3],
  ]) {
    it(`Network ${renderer}: ${kind} grows each arrowhead with its stroke, in the stroke's color`, async () => {
      await withChart(
        [
          "Network",
          {nodes, links, arrows: "both", sizeMax: 14},
          {linkSize: "d => d.w"},
          renderer,
        ],
        (scene, rest) => {
          for (const [key, s, t] of [
            ["network-link-A-B-0", "A", "B"],
            ["network-link-A-C-1", "A", "C"],
            ["network-link-C-D-2", "C", "D"],
            ["network-link-D-D-3", "D", "D"],
          ]) {
            const i = key.split("-").pop();
            const link = scene[key];
            assert.ok(
              Math.abs(link.strokeWidth - rest[key].strokeWidth * width) < 1e-6,
              `${key} is ${width}× as wide`,
            );
            for (const end of ["t", "s"]) {
              const arrowKey = `network-arrow-${s}-${t}-${i}-${end}`;
              const arrow = scene[arrowKey];
              assert.strictEqual(
                arrow.fill,
                link.stroke,
                `${arrowKey} takes its link's ${kind} stroke color`,
              );
              assert.strictEqual(
                arrow.stroke,
                undefined,
                `${arrowKey}: no outline`,
              );
              assert.ok(
                arrowLength(arrow) >= arrowLength(rest[arrowKey]) - 1e-6,
                `${arrowKey} doesn't shrink`,
              );
              assert.ok(
                arrowLength(arrow) * 1.2 >= link.strokeWidth,
                `${arrowKey} (${arrowLength(arrow)}) is wider than its ${link.strokeWidth}px stroke`,
              );
              assertEndsInside(
                scene,
                key,
                arrowKey,
                end === "t" ? "target" : "source",
                {curved: s === t},
              );
            }
          }
          // A thick link's head grows with it.
          assert.ok(
            arrowLength(scene["network-arrow-A-C-1-t"]) >
              arrowLength(rest["network-arrow-A-C-1-t"]) + 1,
            "the thick link's head grows",
          );
        },
        kind,
      );
    });
  }

  it(`ArcDiagram and Rings ${renderer}: hover keeps arrowheads over their wider strokes`, async () => {
    await withChart(
      [
        "ArcDiagram",
        {nodes, links, arrows: "both"},
        {linkSize: "d => d.w"},
        renderer,
      ],
      scene => {
        for (const key of ["arc-link-A-C-1", "arc-link-D-D-3"]) {
          const prefix = key.replace("arc-link-", "arc-arrow-");
          for (const end of ["t", "s"]) {
            assert.strictEqual(
              scene[`${prefix}-${end}`].fill,
              scene[key].stroke,
            );
            assertEndsInside(
              scene,
              key,
              `${prefix}-${end}`,
              end === "t" ? "target" : "source",
              {curved: true},
            );
          }
        }
      },
      "hover",
    );
    await withChart(
      [
        "Rings",
        {
          links: [
            {source: "A", target: "B"},
            {source: "B", target: "D"},
          ],
          center: "A",
          arrows: true,
        },
        {},
        renderer,
      ],
      scene => {
        assert.strictEqual(
          scene["rings-arrow-A-B-0-t"].fill,
          scene["rings-link-A-B"].stroke,
        );
        assertEndsInside(scene, "rings-link-A-B", "rings-arrow-A-B-0-t");
        assertEndsInside(
          scene,
          "rings-link-B-D",
          "rings-arrow-t-B-D-1",
          "target",
          {curved: true},
        );
      },
      "active",
    );
  });
}
