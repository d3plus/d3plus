import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";
import {textLineBoxes} from "../../src/charts/features/linkLabels.ts";

window.__textLineBoxes = textLineBoxes;
import {contrastRatio} from "../../../color/src/oklab.ts";
import {themeDark} from "../../src/utils/theme.ts";

/**
    `linkColor` and `linkLabel` in Chromium, on SVG and Canvas: Network links
    colored along the colorScale by a number (with the colorScale showing),
    Rings and Sankey links colored by their source, ArcDiagram's existing
    modes, arrowheads in their link's color, labels at each link's middle
    without overlaps, the dark theme, and hover dimming.
*/

const nodes = [
  {id: "Alpha", region: "North", x: 0, y: 0},
  {id: "Bravo", region: "North", x: 3, y: 1},
  {id: "Charlie", region: "South", x: 1, y: 3},
  {id: "Delta", region: "South", x: 4, y: 4},
  {id: "Echo", region: "East", x: 6, y: 2},
  {id: "Foxtrot", region: "East", x: 7, y: 5},
];
const links = [
  {source: "Alpha", target: "Bravo", volume: 12, kind: "road"},
  {source: "Alpha", target: "Charlie", volume: 40, kind: "rail"},
  {source: "Bravo", target: "Delta", volume: 25, kind: "road"},
  {source: "Bravo", target: "Echo", volume: 8, kind: "air"},
  {source: "Charlie", target: "Delta", volume: 33, kind: "rail"},
  {source: "Delta", target: "Foxtrot", volume: 18, kind: "road"},
  {source: "Echo", target: "Foxtrot", volume: 50, kind: "air"},
];
const flows = [
  {source: "Coal", target: "Power", value: 40},
  {source: "Gas", target: "Power", value: 25},
  {source: "Gas", target: "Heat", value: 15},
  {source: "Power", target: "Homes", value: 45},
  {source: "Power", target: "Industry", value: 20},
  {source: "Heat", target: "Homes", value: 15},
];

const box = "<div id='viz' style='width:640px;height:440px'></div>";

/**
    Runs in the page: draws a chart and reads its painted scene back: the
    links (stroke, opacity, datum ends), the nodes' fills by id, the
    arrowheads, the link label groups (with their pad and text), and whether
    a colorScale drew.
*/
const draw = ([chart, config, renderer, hover]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config(config);
    viz.render(() => {
      if (!hover) return resolve(read());
      viz.hover(linkOrNode(hover));
      // The hover repaint lands on the next animation frame.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(read())));
    });
    function read() {
      const scene = viz._paintedScene.root;
      const all = sceneNodes(scene);
      const isLink = n =>
        n.type === "path" &&
        /-link-/.test(String(n.key)) &&
        !String(n.key).endsWith("::hit");
      const isNode = n =>
        (n.type === "circle" || n.type === "rect") &&
        /^(network-(Circle|Rect)|rings-(Circle|Rect)|sankey-(Rect|Circle)|arc-node)-/.test(
          String(n.key),
        );
      const fills = {};
      const pos = {};
      for (const n of all.filter(isNode)) {
        const id = n.datum.id ?? n.datum.data?.id;
        if (id === undefined) continue;
        fills[id] = n.paint.fill;
        if (n.type === "circle") pos[id] = [n.cx, n.cy];
      }
      const linksOut = all.filter(isLink).map(n => ({
        key: String(n.key),
        stroke: n.paint.stroke,
        strokeOpacity: n.paint.strokeOpacity,
        fill: n.paint.fill,
        fillOpacity: n.paint.fillOpacity,
        opacity: n.paint.opacity ?? 1,
        source: n.datum.source.id,
        target: n.datum.target.id,
        dom:
          renderer === "svg"
            ? document
                .querySelector(`#viz path[d="${n.d}"]`)
                ?.getAttribute("stroke")
            : undefined,
      }));
      const arrows = all
        .filter(n => /-arrow-/.test(String(n.key)))
        .map(n => ({
          fill: n.paint.fill,
          source: n.datum.source.id,
          target: n.datum.target.id,
        }));
      const labels = all
        .filter(n => n.type === "group" && /-label-group$/.test(String(n.key)))
        .map(n => {
          const [pad, text] = n.children;
          return {
            key: String(n.key),
            x: n.transform.x,
            y: n.transform.y,
            rotate: n.transform.rotate ?? 0,
            width: pad.width,
            height: pad.height,
            interactive: n.interactive,
            opacity: n.paint?.opacity ?? 1,
            padFill: pad.paint.fill,
            textFill: text.paint.fill,
            text: text.lines.map(l => l.text).join(" "),
            source: n.datum.source.id,
            target: n.datum.target.id,
          };
        });
      const nodeLabelBoxes = all
        .filter(n => n.type === "text" && /^rings-label-/.test(String(n.key)))
        .flatMap(n => window.__textLineBoxes([n]));
      const colorScale = all.some(
        n => String(n.key) === "viz-colorScale" && n.children?.length,
      );
      const bucketOf = d => {
        while (d && d.__d3plus__ && d.data) d = d.data;
        return d && d._isColorScaleBucket ? d : null;
      };
      const buckets = all
        .filter(n => n.type === "rect" && bucketOf(n.datum))
        .map(n => n.paint?.fill)
        .filter(Boolean);
      return {
        links: linksOut,
        fills,
        pos,
        nodeLabelBoxes,
        arrows,
        labels,
        colorScale,
        buckets,
      };
    }
    function linkOrNode(id) {
      return d =>
        d.source ? d.source.id === id || d.target.id === id : d.id === id;
    }
  });

const graph = {nodes, data: nodes, links};

/** The corners of a label box rotated by `rotate` degrees about its center. */
const corners = l => {
  const r = (l.rotate * Math.PI) / 180;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const x = (sx * l.width) / 2;
    const y = (sy * l.height) / 2;
    return [
      l.x + x * Math.cos(r) - y * Math.sin(r),
      l.y + x * Math.sin(r) + y * Math.cos(r),
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

for (const renderer of ["svg", "canvas"]) {
  it(`Network ${renderer}: a numeric linkColor colors links along the colorScale and shows it`, async () => {
    const {
      links: drawn,
      colorScale,
      buckets,
      fills,
    } = await render(box, draw, [
      "Network",
      {...graph, color: "region", linkColor: "volume", sizeMax: 12},
      renderer,
    ]);
    assert.strictEqual(drawn.length, links.length);
    assert.ok(colorScale, "the colorScale draws");
    assert.ok(buckets.length > 1, "with buckets");
    const strokeOf = (s, t) =>
      drawn.find(l => l.source === s && l.target === t).stroke;
    const low = strokeOf("Bravo", "Echo");
    const high = strokeOf("Echo", "Foxtrot");
    assert.notStrictEqual(low, high, "the lowest and highest differ");
    assert.ok(buckets.includes(low), "the low link's color is a bucket");
    assert.ok(buckets.includes(high), "the high link's color is a bucket");
    assert.strictEqual(
      new Set(drawn.map(l => l.stroke)).size > 2,
      true,
      "several colors",
    );
    assert.ok(
      !Object.values(fills).some(f => buckets.includes(f)),
      "nodes keep their categorical colors",
    );
    if (renderer === "svg")
      for (const l of drawn) assert.strictEqual(l.dom, l.stroke, "painted");
  });

  it(`Network ${renderer}: arrowheads take their link's color`, async () => {
    const {links: drawn, arrows} = await render(box, draw, [
      "Network",
      {...graph, linkColor: "kind", arrows: "both"},
      renderer,
    ]);
    assert.strictEqual(arrows.length, links.length * 2);
    for (const a of arrows) {
      const link = drawn.find(
        l => l.source === a.source && l.target === a.target,
      );
      assert.strictEqual(a.fill, link.stroke);
    }
    const kinds = new Set(drawn.map(l => l.stroke));
    assert.strictEqual(kinds.size, 3, "one color per kind");
  });

  it(`Rings ${renderer}: linkColor "source" takes the source node's color`, async () => {
    const {
      links: drawn,
      fills,
      arrows,
    } = await render(box, draw, [
      "Rings",
      {
        ...graph,
        center: "Bravo",
        color: "id",
        linkColor: "source",
        arrows: true,
      },
      renderer,
    ]);
    assert.ok(drawn.length >= 3);
    for (const l of drawn) assert.strictEqual(l.stroke, fills[l.source]);
    assert.ok(new Set(drawn.map(l => l.stroke)).size > 1);
    for (const a of arrows)
      assert.strictEqual(a.fill, fills[a.source], "arrows match");
  });

  it(`Sankey ${renderer}: linkColor "source" colors each band, see-through`, async () => {
    const {links: drawn, fills} = await render(box, draw, [
      "Sankey",
      {links: flows, linkColor: "source"},
      renderer,
    ]);
    assert.strictEqual(drawn.length, flows.length);
    // Bands are filled ribbons: linkColor colors their fill.
    for (const l of drawn) {
      assert.strictEqual(l.fill, fills[l.source]);
      assert.strictEqual(l.fillOpacity, 0.5);
      assert.strictEqual(l.stroke, undefined);
    }
    const gray = await render(box, draw, ["Sankey", {links: flows}, renderer]);
    assert.strictEqual(
      new Set(gray.links.map(l => l.fill)).size,
      1,
      "the default stays one gray",
    );
    assert.strictEqual(gray.links[0].fillOpacity, undefined);
  });

  it(`ArcDiagram ${renderer}: linkColor false, "source", and "target" draw as before`, async () => {
    const base = {...graph, color: "region"};
    const gray = await render(box, draw, ["ArcDiagram", base, renderer]);
    assert.strictEqual(new Set(gray.links.map(l => l.stroke)).size, 1);
    assert.ok(!Object.values(gray.fills).includes(gray.links[0].stroke));
    for (const end of ["source", "target"]) {
      const {links: drawn, fills} = await render(box, draw, [
        "ArcDiagram",
        {...base, linkColor: end},
        renderer,
      ]);
      for (const l of drawn) assert.strictEqual(l.stroke, fills[l[end]]);
    }
  });

  it(`Network ${renderer}: labels sit at each link's middle, and none overlap`, async () => {
    const {labels} = await render(box, draw, [
      "Network",
      {...graph, linkLabel: "volume", sizeMax: 8},
      renderer,
    ]);
    assert.ok(labels.length >= 5, `most links labeled (${labels.length})`);
    for (const l of labels) {
      assert.strictEqual(l.interactive, false);
      assert.strictEqual(
        l.text,
        String(
          links.find(k => k.source === l.source && k.target === l.target)
            .volume,
        ),
      );
      assert.ok(l.rotate >= -90 && l.rotate < 90, "upright");
    }
    for (let a = 0; a < labels.length; a++)
      for (let b = a + 1; b < labels.length; b++)
        assert.ok(
          !overlap(corners(labels[a]), corners(labels[b])),
          `${labels[a].key} / ${labels[b].key}`,
        );
  });

  it(`Sankey ${renderer}: labels center on their bands, level when horizontal`, async () => {
    const {labels} = await render(box, draw, [
      "Sankey",
      {
        links: flows,
        linkLabel: "value",
        linkLabelConfig: {rotate: "horizontal"},
      },
      renderer,
    ]);
    assert.ok(labels.length >= 3, `${labels.length} labels`);
    for (const l of labels) assert.strictEqual(l.rotate, 0);
    for (let a = 0; a < labels.length; a++)
      for (let b = a + 1; b < labels.length; b++)
        assert.ok(!overlap(corners(labels[a]), corners(labels[b])));
  });

  it(`ArcDiagram ${renderer}: labels sit at the top of each arc`, async () => {
    const {labels, pos} = await render(box, draw, [
      "ArcDiagram",
      {...graph, linkLabel: "kind"},
      renderer,
    ]);
    assert.ok(labels.length >= 4, `${labels.length} labels`);
    for (const l of labels) {
      const [x0, y0] = pos[l.source];
      const [x1] = pos[l.target];
      assert.ok(Math.abs(l.x - (x0 + x1) / 2) < 0.01, "midway along the line");
      // A semicircle (or flattened arc) rises from the line toward the top.
      assert.ok(l.y < y0, "above the line");
      assert.strictEqual(l.rotate, 0);
    }
  });

  it(`Rings ${renderer}: link labels keep clear of the node labels`, async () => {
    const {labels, nodeLabelBoxes} = await render(box, draw, [
      "Rings",
      {...graph, center: "Bravo", linkLabel: "kind"},
      renderer,
    ]);
    assert.ok(nodeLabelBoxes.length >= nodes.length - 1, "node labels drawn");
    assert.ok(labels.length > 0, "some link labels fit");
    for (const l of labels)
      for (const b of nodeLabelBoxes)
        assert.ok(
          !overlap(corners(l), corners({...b, rotate: b.angle})),
          `${l.key} clear of a node label`,
        );
  });

  it(`Network ${renderer}: the lowest numeric link still reads as a line`, async () => {
    for (const theme of ["light", "dark"]) {
      const {links: drawn, buckets} = await render(box, draw, [
        "Network",
        {...graph, theme, linkColor: "volume", sizeMax: 8},
        renderer,
      ]);
      const low = drawn.find(l => l.source === "Bravo" && l.target === "Echo");
      const bg = theme === "dark" ? themeDark.background : "#ffffff";
      const ratio = contrastRatio(low.stroke, bg);
      assert.ok(ratio >= 1.5, `${theme}: ${low.stroke} on ${bg} is ${ratio}`);
      assert.ok(buckets.includes(low.stroke), `${theme}: the legend matches`);
    }
  });

  it(`Network ${renderer}: nodes sharing the colorScale with links match its legend`, async () => {
    const {
      fills,
      buckets,
      links: drawn,
    } = await render(box, draw, [
      "Network",
      {
        ...graph,
        data: nodes.map((n, i) => ({...n, score: i * 10})),
        colorScale: "score",
        linkColor: "volume",
        sizeMax: 8,
      },
      renderer,
    ]);
    for (const f of Object.values(fills)) assert.ok(buckets.includes(f));
    for (const l of drawn) assert.ok(buckets.includes(l.stroke));
  });

  it(`Rings ${renderer}: labels sit on their edges, clear of the nodes`, async () => {
    const {labels, pos} = await render(box, draw, [
      "Rings",
      {...graph, center: "Bravo", linkLabel: "kind"},
      renderer,
    ]);
    assert.ok(labels.length > 0);
    for (const l of labels) {
      for (const [x, y] of Object.values(pos))
        assert.ok(Math.hypot(l.x - x, l.y - y) > 1, "not on a node's center");
    }
  });

  it(`Network ${renderer}: labels and links read on the dark theme`, async () => {
    const {
      labels,
      links: drawn,
      buckets,
    } = await render(box, draw, [
      "Network",
      {
        ...graph,
        theme: "dark",
        linkColor: "volume",
        linkLabel: "kind",
        sizeMax: 8,
      },
      renderer,
    ]);
    assert.ok(labels.length > 0);
    for (const l of labels) {
      assert.strictEqual(
        l.padFill.toLowerCase(),
        themeDark.background.toLowerCase(),
      );
      assert.strictEqual(
        l.textFill.toLowerCase(),
        themeDark.text.toLowerCase(),
      );
    }
    for (const l of drawn) assert.ok(buckets.includes(l.stroke));
  });

  it(`Network ${renderer}: hovering a node dims the other links and their labels`, async () => {
    const {labels, links: drawn} = await render(box, draw, [
      "Network",
      {...graph, linkColor: "volume", linkLabel: "volume", sizeMax: 8},
      renderer,
      "Alpha",
    ]);
    const touches = l => l.source === "Alpha" || l.target === "Alpha";
    for (const l of drawn)
      assert.strictEqual(l.opacity < 1, !touches(l), `link ${l.key}`);
    assert.ok(
      labels.some(l => !touches(l)),
      "a label away from Alpha",
    );
    for (const l of labels)
      assert.strictEqual(l.opacity < 1, !touches(l), `label ${l.key}`);
  });

  it(`Network ${renderer}: hovering a link marks its value on the colorScale`, async () => {
    const {page, close} = await openPage(box);
    try {
      const point = await page.evaluate(
        ([renderer]) =>
          new Promise(resolve => {
            const nodes = [
              {id: "a", x: 0, y: 0},
              {id: "b", x: 10, y: 0},
              {id: "c", x: 20, y: 0},
            ];
            const viz = new window.d3plus.Network()
              .select("#viz")
              .renderer(renderer)
              .duration(0)
              .nodes(nodes)
              .data(nodes)
              .links([
                {source: "a", target: "b", w: 10},
                {source: "b", target: "c", w: 90},
              ])
              .linkColor("w")
              .linkSize(6)
              .sizeMax(8);
            window.__viz = viz;
            viz.render(() => {
              const host =
                document.querySelector("#viz svg") ||
                document.querySelector("#viz canvas");
              const rect = host.getBoundingClientRect();
              const [, link] = viz.ctx.networkCtx.links;
              const t = viz._chartTransform || {x: 0, y: 0};
              // A quarter of the way along the second link.
              const x = link.source.x + (link.target.x - link.source.x) / 4;
              resolve([rect.left + t.x + x, rect.top + t.y + link.source.y]);
            });
          }),
        [renderer],
      );
      await page.mouse.move(point[0], point[1] - 40);
      await page.mouse.move(point[0], point[1], {steps: 4});
      await page.waitForTimeout(150);
      const marked = await page.evaluate(() =>
        window.__viz._colorScaleClass.hover(),
      );
      assert.strictEqual(marked, 90);
    } finally {
      await close();
    }
  });
}
