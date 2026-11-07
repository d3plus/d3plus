import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {pathTextBoxes, samplePath, textPathSamples} from "@d3plus/render";
import {textLineBoxes} from "../../src/charts/features/linkLabels.ts";
import {sankeyLinkIds, sankeyLinkPath} from "../../src/charts/Sankey/emit.ts";
import {focusTargets} from "../../src/charts/viz/focusTargets.ts";
import {themeDark} from "../../src/utils/theme.ts";

/**
    Link labels along curved links, in Chromium on SVG and Canvas: on Rings
    splines and fanned parallel links, ArcDiagram arcs, bundled Network
    links and loops, Geomap flow arcs, and Sankey bands and return lanes,
    each curved label's glyphs sit on its link's centerline and read
    upright, straight links keep their straight labels, the collision pass
    still hides labels, labels stay inert and dim with their link, and the
    dark theme, small multiples, and reducedMotion still draw them.
*/

const box = "<div id='viz' style='width:720px;height:540px'></div>";

const ringLinks = [
  {source: "Hub", target: "North", kind: "trade"},
  {source: "Hub", target: "North", kind: "aid"},
  {source: "North", target: "East", kind: "shipping"},
];
const kinds = ["trade", "aid", "loan", "rail", "ferry"];
["North", "East", "South", "West", "Port"].forEach((p, i) => {
  if (p !== "North") ringLinks.push({source: "Hub", target: p, kind: kinds[i]});
  for (let c = 0; c < 3; c++)
    ringLinks.push({
      source: p,
      target: `${p} ${c + 1}`,
      kind: kinds[(i + c + 1) % kinds.length],
    });
});

const arcNodes = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"].map(
  id => ({id}),
);
const arcLinks = [
  {source: "Alpha", target: "Bravo", kind: "road"},
  {source: "Alpha", target: "Charlie", kind: "shipping"},
  {source: "Bravo", target: "Delta", kind: "pipeline"},
  {source: "Charlie", target: "Delta", kind: "rail"},
  {source: "Delta", target: "Foxtrot", kind: "road"},
  {source: "Echo", target: "Foxtrot", kind: "air"},
  {source: "Bravo", target: "Echo", kind: "air freight"},
];

/** Three clusters of five nodes, with links between the clusters and a loop. */
const points = [];
const netLinks = [];
for (let g = 0; g < 3; g++)
  for (let k = 0; k < 5; k++) {
    const a = (g / 3) * Math.PI * 2 + (k - 2) * 0.18;
    const r = 3 + (k % 2) * 0.6;
    points.push({id: `n${g}${k}`, x: Math.cos(a) * r, y: Math.sin(a) * r});
  }
for (let a = 0; a < 3; a++)
  for (let b = a + 1; b < 3; b++)
    for (let j = 0; j < 5; j++)
      netLinks.push({
        source: `n${a}${j}`,
        target: `n${b}${(j + 2) % 5}`,
        weight: 1 + ((a + b + j) % 4),
      });
netLinks.push({source: "n00", target: "n00", weight: 3});

const cities = [
  {id: "NYC", point: [-74.0, 40.71]},
  {id: "LON", point: [-0.13, 51.51]},
  {id: "DXB", point: [55.27, 25.2]},
  {id: "TYO", point: [139.69, 35.69]},
  {id: "SYD", point: [151.21, -33.87]},
  {id: "JNB", point: [28.05, -26.2]},
];
const routes = [
  {source: "NYC", target: "LON", passengers: 3200},
  {source: "LON", target: "DXB", passengers: 1800},
  {source: "DXB", target: "SYD", passengers: 900},
  {source: "DXB", target: "JNB", passengers: 700},
  {source: "TYO", target: "SYD", passengers: 1400},
];

const flows = [
  {source: "Coal", target: "Power", value: 40},
  {source: "Gas", target: "Power", value: 25},
  {source: "Gas", target: "Heat", value: 15},
  {source: "Power", target: "Homes", value: 45},
  {source: "Power", target: "Industry", value: 20},
  {source: "Heat", target: "Homes", value: 15},
  {source: "Industry", target: "Gas", value: 30},
];

const charts = {
  Rings: {links: ringLinks, center: "Hub", linkLabel: "kind"},
  ArcDiagram: {nodes: arcNodes, links: arcLinks, linkLabel: "kind"},
  Network: {
    nodes: points,
    data: points,
    links: netLinks,
    linkBundle: true,
    linkSize: "d => d.weight",
    linkLabel: "d => `${d.weight} units`",
  },
  Geomap: {
    data: cities,
    point: "d => d.point",
    links: routes,
    linkCurve: 0.3,
    linkLabel: "passengers",
    tiles: false,
  },
  Sankey: {
    links: flows,
    linkLabel: "d => `${d.value} TWh delivered`",
    linkLabelConfig: {fontSize: 11},
  },
};

/**
    Runs in the page: draws a chart (its accessors given as source) and reads back each link label (its
    glyphs' centers and boxes, in the chart's coordinates, how far each
    glyph sits from its link's centerline, and which way its text path
    runs), the links, the node circles, and the focus stops.
*/
const draw = ([chart, config, renderer, hover]) =>
  new Promise(resolve => {
    // Accessors cross into the page as their source.
    const resolved = Object.fromEntries(
      Object.entries(config).map(([k, v]) => [
        k,
        typeof v === "string" && v.includes("=>")
          ? new Function(`return ${v}`)()
          : v,
      ]),
    );
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config(resolved);
    viz.render(() => {
      if (!hover) return resolve(read());
      viz.hover(d =>
        d.source ? d.source.id === hover || d.target.id === hover : false,
      );
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(read())));
    });

    function read() {
      const root = viz._paintedScene.root;
      const links = {};
      const groups = [];
      const circles = [];
      const at = (t, x, y) => [t.x + t.s * x, t.y + t.s * y];
      /** The distance from `p` to a polyline. */
      const away = (pts, p) => {
        let best = Infinity;
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1];
          const [bx, by] = pts[k];
          const dx = bx - ax,
            dy = by - ay;
          const l2 = dx * dx + dy * dy || 1;
          const u = Math.max(
            0,
            Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / l2),
          );
          best = Math.min(
            best,
            Math.hypot(ax + dx * u - p[0], ay + dy * u - p[1]),
          );
        }
        return best;
      };
      const walk = (node, t) => {
        const tr = node.transform || {};
        const here = {
          x: t.x + t.s * (tr.x || 0),
          y: t.y + t.s * (tr.y || 0),
          s: t.s * (tr.scale || 1),
        };
        const key = String(node.key);
        if (/-label-group$/.test(key)) groups.push({node, t: here});
        else if (
          node.type === "path" &&
          /-link-/.test(key) &&
          !/::hit$|-label-pad$/.test(key)
        )
          links[key] = {node, t: here};
        else if (node.type === "circle" && node.datum && !node.datum.source)
          circles.push({...at(here, node.cx, node.cy), r: node.r * here.s});
        (node.children || []).forEach(c => walk(c, here));
      };
      walk(root, {x: 0, y: 0, s: 1});
      // Sankey bands are filled ribbons: their centerlines come from the layout.
      const centerlines = {};
      const sankey = viz.ctx?.sankeyCtx;
      if (chart === "Sankey" && sankey && !config.facet) {
        const ids = sankeyLinkIds(sankey.links);
        sankey.links.forEach((l, i) => {
          centerlines[`sankey-link-${ids[i]}`] = sankeyLinkPath(l);
        });
      }
      const labels = groups.map(({node, t}) => {
        const key = String(node.key).replace(/-label-group$/, "");
        const [pad, text] = node.children;
        const curved = pad.type === "path";
        const tt = text.transform || {};
        const world = (x, y) => at(t, (tt.x || 0) + x, (tt.y || 0) + y);
        const label = {
          key,
          curved,
          interactive: node.interactive,
          childInteractive: node.children.map(c => c.interactive),
          opacity: node.paint?.opacity ?? 1,
          source: node.datum?.source?.id,
          target: node.datum?.target?.id,
          text: text.lines.map(l => l.text).join(" "),
          padStroke: pad.paint.stroke,
          padFill: pad.paint.fill,
          textFill: text.paint.fill,
          transform: node.transform || null,
        };
        if (!curved) {
          const tr = node.transform;
          label.boxes = [
            {
              x: t.x,
              y: t.y,
              width: pad.width * t.s,
              height: pad.height * t.s,
              angle: tr.rotate || 0,
            },
          ];
          const link = links[key];
          if (link && link.node.d && !/sankey-link-/.test(key)) {
            const pts = samplePath(link.node.d, 1).points.map(([x, y]) =>
              at(link.t, x, y),
            );
            label.offLink = away(pts, [label.boxes[0].x, label.boxes[0].y]);
          }
          return label;
        }
        const glyphs = pathTextBoxes(text).map(b => world(b.x, b.y));
        label.glyphs = glyphs;
        label.boxes = textLineBoxes([text]).map(b => {
          const [x, y] = world(b.x - (tt.x || 0), b.y - (tt.y || 0));
          return {...b, x, y, width: b.width * t.s, height: b.height * t.s};
        });
        const run = textPathSamples(text.path).points;
        const [x0, y0] = run[0];
        const [x1, y1] = run[run.length - 1];
        label.run = {dx: x1 - x0, dy: y1 - y0};
        label.turns = label.boxes.map(b => b.angle);
        // How far each glyph's middle sits from its link's centerline.
        const line =
          centerlines[key] ||
          (links[key] && !/sankey-link-/.test(key)
            ? samplePath(links[key].node.d, 1).points
            : null);
        if (line) {
          const lt = links[key]?.t ?? t;
          const pts = line.map(([x, y]) => at(lt, x, y));
          label.offLink = Math.max(...glyphs.map(g => away(pts, g)));
        } else if (links[key]) {
          // A band without a known centerline: every glyph inside it.
          const {node: band, t: bt} = links[key];
          const ctx = document.createElement("canvas").getContext("2d");
          const p2d = new Path2D(band.d);
          label.inBand = glyphs.every(([gx, gy]) =>
            ctx.isPointInPath(p2d, (gx - bt.x) / bt.s, (gy - bt.y) / bt.s),
          );
        }
        return label;
      });
      const focus = focusTargets(root.children || []).map(f =>
        String(f.node.key),
      );
      return {labels, circles, focus, links: Object.keys(links)};
    }
  });

/** The corners of a box rotated `angle` degrees about its center. */
const corners = b => {
  const r = (b.angle * Math.PI) / 180;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const x = (sx * b.width) / 2;
    const y = (sy * b.height) / 2;
    return [
      b.x + x * Math.cos(r) - y * Math.sin(r),
      b.y + x * Math.sin(r) + y * Math.cos(r),
    ];
  });
};

/** Whether two convex polygons overlap (separating axes). */
const overlap = (a, b) => {
  for (const poly of [a, b])
    for (let k = 0; k < poly.length; k++) {
      const [p, q] = [poly[k], poly[(k + 1) % poly.length]];
      const n = [q[1] - p[1], p[0] - q[0]];
      const proj = pts => pts.map(([x, y]) => x * n[0] + y * n[1]);
      const pa = proj(a);
      const pb = proj(b);
      if (Math.max(...pa) <= Math.min(...pb) + 1e-6) return false;
      if (Math.max(...pb) <= Math.min(...pa) + 1e-6) return false;
    }
  return true;
};

/** Whether any of two labels' boxes overlap. */
const labelsMeet = (a, b) =>
  a.boxes.some(p => b.boxes.some(q => overlap(corners(p), corners(q))));

/** Whether a rotated box overlaps a circle. */
const boxHitsCircle = (b, c) => {
  const r = (-b.angle * Math.PI) / 180;
  const dx = c.x - b.x,
    dy = c.y - b.y;
  const lx = dx * Math.cos(r) - dy * Math.sin(r);
  const ly = dx * Math.sin(r) + dy * Math.cos(r);
  const nx = Math.max(-b.width / 2, Math.min(b.width / 2, lx));
  const ny = Math.max(-b.height / 2, Math.min(b.height / 2, ly));
  return Math.hypot(lx - nx, ly - ny) < c.r - 0.5;
};

/** Whether a text path reads upright: left to right, or bottom to top when steep. */
const upright = ({dx, dy}) =>
  Math.abs(dx) < Math.abs(dy) * 0.02 ? dy < 0 : dx > 0;

/** The fewest curved labels each chart's data draws. */
const minCurved = {Rings: 6, ArcDiagram: 4, Network: 2, Geomap: 3, Sankey: 2};

for (const renderer of ["svg", "canvas"]) {
  for (const chart of Object.keys(charts)) {
    it(`${chart} ${renderer}: curved links' labels follow them, upright, and clear of each other`, async () => {
      const {labels, circles} = await render(box, draw, [
        chart,
        charts[chart],
        renderer,
      ]);
      const curved = labels.filter(l => l.curved);
      assert.ok(
        curved.length >= minCurved[chart],
        `${curved.length} curved of ${labels.length}`,
      );
      for (const l of curved) {
        assert.ok(l.glyphs.length > 0, `${l.key} has glyphs`);
        if (l.offLink !== undefined)
          assert.ok(l.offLink < 1.5, `${l.key} sits ${l.offLink}px off`);
        else assert.ok(l.inBand, `${l.key} inside its band`);
        assert.ok(upright(l.run), `${l.key} reads upright`);
        assert.strictEqual(l.interactive, false);
        assert.deepStrictEqual(l.childInteractive, [false, false]);
        assert.strictEqual(l.padFill, "none");
      }
      const spread = l => Math.max(...l.turns) - Math.min(...l.turns);
      assert.ok(
        curved.some(l => spread(l) > 5),
        "some bend visibly",
      );
      for (const l of labels.filter(l => !l.curved && l.offLink !== undefined))
        assert.ok(l.offLink < 1, `${l.key}: a straight label on its link`);
      for (let a = 0; a < labels.length; a++) {
        for (let b = a + 1; b < labels.length; b++)
          assert.ok(
            !labelsMeet(labels[a], labels[b]),
            `${labels[a].key} / ${labels[b].key}`,
          );
        for (const c of circles)
          for (const b of labels[a].boxes)
            assert.ok(!boxHitsCircle(b, c), `${labels[a].key} covers a node`);
      }
    });
  }

  it(`Network ${renderer}: straight links keep their straight labels`, async () => {
    const nodes = [
      {id: "Alpha", x: 0, y: 0},
      {id: "Bravo", x: 3, y: 1},
      {id: "Charlie", x: 1, y: 3},
      {id: "Delta", x: 4, y: 4},
      {id: "Echo", x: 6, y: 2},
      {id: "Foxtrot", x: 7, y: 5},
    ];
    const {labels} = await render(box, draw, [
      "Network",
      {nodes, data: nodes, links: arcLinks, linkLabel: "kind"},
      renderer,
    ]);
    assert.ok(labels.length >= 3, `${labels.length} labels`);
    for (const l of labels) {
      assert.strictEqual(l.curved, false);
      assert.ok(l.transform && l.transform.rotate !== undefined, l.key);
      assert.ok(l.transform.rotate > -90 && l.transform.rotate <= 90);
      assert.ok(l.offLink < 1, `${l.key} on its link`);
    }
  });

  it(`Rings ${renderer}: links out from the center keep straight labels`, async () => {
    // Large enough that the spokes' labels fit whatever the font's widths.
    const {labels} = await render(
      "<div id='viz' style='width:1100px;height:900px'></div>",
      draw,
      ["Rings", charts.Rings, renderer],
    );
    const spokes = labels.filter(l =>
      /^rings-link-Hub-(East|South|West|Port)$/.test(l.key),
    );
    assert.ok(spokes.length > 0, labels.map(l => l.key).join());
    for (const l of spokes) assert.strictEqual(l.curved, false, l.key);
  });

  it(`Network ${renderer}: the collision pass hides curved labels that would overlap`, async () => {
    const {labels} = await render(box, draw, [
      "Network",
      {
        ...charts.Network,
        linkLabel: "d => `a long label for ${d.weight} units of flow`",
      },
      renderer,
    ]);
    // Nearly every bundled link shares its middle with others.
    assert.ok(labels.length > 0, "some labels fit");
    assert.ok(
      labels.length < netLinks.length / 2,
      `${labels.length} of ${netLinks.length} labeled`,
    );
    for (let a = 0; a < labels.length; a++)
      for (let b = a + 1; b < labels.length; b++)
        assert.ok(!labelsMeet(labels[a], labels[b]));
  });

  it(`Network ${renderer}: curved labels stay inert and dim with their link`, async () => {
    const {labels, focus} = await render(box, draw, [
      "Network",
      charts.Network,
      renderer,
      "n00",
    ]);
    assert.ok(
      focus.every(k => !/-label/.test(k)),
      "no label is a focus stop",
    );
    assert.ok(
      focus.some(k => /^network-link-/.test(k)),
      "links are",
    );
    const touches = l => l.source === "n00" || l.target === "n00";
    const curved = labels.filter(l => l.curved);
    assert.ok(
      curved.some(l => !touches(l)),
      "a label away from n00",
    );
    for (const l of curved)
      assert.strictEqual(l.opacity < 1, !touches(l), `${l.key} dims`);
  });

  it(`ArcDiagram ${renderer}: curved labels take the dark theme's colors`, async () => {
    const {labels} = await render(box, draw, [
      "ArcDiagram",
      {...charts.ArcDiagram, theme: "dark", reducedMotion: true},
      renderer,
    ]);
    const curved = labels.filter(l => l.curved);
    assert.ok(curved.length >= minCurved.ArcDiagram);
    for (const l of curved) {
      assert.strictEqual(
        l.padStroke.toLowerCase(),
        themeDark.background.toLowerCase(),
      );
      assert.strictEqual(
        l.textFill.toLowerCase(),
        themeDark.text.toLowerCase(),
      );
    }
  });

  it(`Sankey ${renderer}: curved labels follow their bands in each small multiple`, async () => {
    const rows = [
      ...flows.map(l => ({...l, panel: "one"})),
      ...flows.map(l => ({...l, panel: "two"})),
    ];
    const {labels} = await render(box, draw, [
      "Sankey",
      {...charts.Sankey, links: rows, data: rows, facet: "panel"},
      renderer,
    ]);
    const curved = labels.filter(l => l.curved);
    const panels = new Set(curved.map(l => l.key.split("sankey-link-")[0]));
    assert.strictEqual(panels.size, 2, [...panels].join());
    for (const l of curved) assert.ok(l.inBand, `${l.key} inside its band`);
  });
}
