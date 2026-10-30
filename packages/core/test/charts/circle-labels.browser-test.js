import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {rgb} from "d3-color";

import {render} from "~test/browser/render.js";
import {openPage} from "~test/browser/page.js";

/**
    Circle labels (`labelPosition`, issue #138) on both renderers: small
    Network nodes and dense scatter points label beside their circles without
    overlapping each other or any circle, crowded ones hide, a big node keeps
    its label inside, `"inside"` keeps every label inside, the labels beside
    a circle take the chart's ink (also on a dark theme), and they never take
    the pointer or keyboard focus.
*/

const NAMES = [
  "Aurora",
  "Basalt",
  "Cobalt",
  "Dune",
  "Ember",
  "Fjord",
  "Garnet",
  "Harbor",
  "Indigo",
  "Juniper",
  "Kelp",
  "Lagoon",
  "Meadow",
  "Nimbus",
  "Onyx",
  "Prairie",
  "Quartz",
  "Reef",
  "Summit",
  "Tundra",
  "Umber",
  "Vale",
  "Willow",
  "Xenon",
];

/** A seeded generator, so every run draws the same layout. */
function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** Network nodes scattered over a 6 × 4 grid, with links around a ring. */
function networkData() {
  const rand = seeded(11);
  const nodes = NAMES.map((id, i) => ({
    id,
    x: (i % 6) + rand() * 0.6,
    y: Math.floor(i / 6) + rand() * 0.6,
    value: id === "Summit" ? 80 : 1 + rand() * 4,
  }));
  const links = nodes.map((n, i) => ({
    source: n.id,
    target: nodes[(i + 1) % nodes.length].id,
  }));
  return {nodes, links};
}

/** 120 scatter points, most of them packed into one cluster. */
function scatterData() {
  const rand = seeded(5);
  return Array.from({length: 120}, (_, i) => {
    const dense = i < 80;
    return {
      id: `P${i + 1}`,
      x: dense ? 40 + rand() * 20 : rand() * 100,
      y: dense ? 40 + rand() * 20 : rand() * 100,
    };
  });
}

/**
    The chart's circles (data marks only) and label text nodes, in surface
    space: each label's box is its text box, where TextBox lays the line out.
*/
function collect(viz, names) {
  const named = new Set(names);
  const circles = [],
    labels = [];
  const rowOf = d => {
    let row = d;
    while (row && row.data && typeof row.data === "object") row = row.data;
    return row;
  };
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    const row = rowOf(n.datum);
    if (
      n.type === "circle" &&
      !String(n.key).endsWith("::hit") &&
      row &&
      named.has(row.id)
    )
      circles.push({
        id: row.id,
        x: nx + (n.cx || 0),
        y: ny + (n.cy || 0),
        r: n.r,
      });
    if (n.type === "text") {
      const text = n.lines.map(l => l.text).join(" ");
      if (named.has(text))
        labels.push({
          text,
          x: nx,
          y: ny,
          width: n.width,
          height: n.height,
          size: n.font.size,
          fill: n.paint && n.paint.fill,
          interactive: n.interactive,
        });
    }
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(viz._paintedScene.root, 0, 0);
  return {circles, labels};
}

/** Draws `build(d3plus)` into a 600 × 400 `#viz` and collects its circles and labels. */
const draw = (build, renderer, names, size = [600, 400]) =>
  render(
    `<div id="viz" style="width:${size[0]}px;height:${size[1]}px"></div>`,
    ([renderer, names, size]) =>
      new Promise(resolve => {
        const viz = build(window.d3plus)
          .renderer(renderer)
          .width(size[0])
          .height(size[1])
          .duration(0)
          .legend(false)
          .select("#viz");
        viz.render(() => resolve(collect(viz, names)));
      }),
    [renderer, names, size],
  );

/** Whether two boxes overlap by more than half a pixel. */
const overlap = (a, b) =>
  a.x < b.x + b.width - 0.5 &&
  b.x < a.x + a.width - 0.5 &&
  a.y < b.y + b.height - 0.5 &&
  b.y < a.y + a.height - 0.5;

/** Whether a box reaches more than half a pixel into a circle. */
const hits = (box, c) => {
  const dx = Math.max(box.x - c.x, 0, c.x - (box.x + box.width));
  const dy = Math.max(box.y - c.y, 0, c.y - (box.y + box.height));
  return Math.hypot(dx, dy) < c.r - 0.5;
};

/** The labels drawn beside their circles (at `pointLabelConfig.fontSize`). */
const beside = labels => labels.filter(l => l.interactive === false);

/** Asserts no label beside a circle overlaps another label or any circle. */
function assertClear({circles, labels}) {
  for (const a of beside(labels)) {
    for (const c of circles)
      assert.ok(!hits(a, c), `${a.text}'s label clears ${c.id}`);
    for (const b of labels)
      if (b !== a)
        assert.ok(!overlap(a, b), `${a.text}'s label clears ${b.text}'s`);
  }
}

const lightness = color => {
  const {r, g, b} = rgb(color);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** A box of land around southern New England, for the Geomap to fit. */
const region = {
  type: "Topology",
  objects: {
    land: {
      type: "GeometryCollection",
      geometries: [{type: "Polygon", arcs: [[0]], id: "land"}],
    },
  },
  arcs: [
    [
      [-74, 41],
      [-74, 44.5],
      [-69, 44.5],
      [-69, 41],
      [-74, 41],
    ],
  ],
};

const smallNetwork = d3plus => {
  const {nodes, links} = networkData();
  return new d3plus.Network().nodes(nodes).links(links).sizeMax(5);
};

const hubNetwork = d3plus => {
  const {nodes, links} = networkData();
  return new d3plus.Network()
    .nodes(nodes)
    .links(links)
    .size("value")
    .sizeMin(4)
    .sizeMax(40);
};

const denseScatter = d3plus =>
  new d3plus.Plot().data(scatterData()).groupBy("id").x("x").y("y");

const scatterNames = scatterData().map(d => d.id);

for (const renderer of ["svg", "canvas"]) {
  describe(`circle labels (${renderer})`, () => {
    it("a Network with small nodes labels them beside each node, clear of each other and every node", async () => {
      const drawn = await draw(smallNetwork, renderer, NAMES);
      assert.strictEqual(drawn.circles.length, NAMES.length);
      const out = beside(drawn.labels);
      assert.ok(out.length >= NAMES.length / 2, `${out.length} labels beside`);
      out.forEach(l => assert.strictEqual(l.size, 11));
      assertClear(drawn);
    });

    it("a large node keeps its label inside, at a readable size", async () => {
      const drawn = await draw(hubNetwork, renderer, NAMES);
      const hub = drawn.circles.find(c => c.id === "Summit");
      const label = drawn.labels.find(l => l.text === "Summit");
      assert.ok(label, "the hub is labeled");
      assert.notStrictEqual(label.interactive, false, "inside, not beside");
      const cx = label.x + label.width / 2,
        cy = label.y + label.height / 2;
      assert.ok(Math.hypot(cx - hub.x, cy - hub.y) < hub.r, "inside the hub");
      assert.ok(label.size >= 10, `font ${label.size}px`);
      // Inside labels never shrink below the readable size in "auto".
      drawn.labels
        .filter(l => l.interactive !== false)
        .forEach(l => assert.ok(l.size >= 10, `${l.text} ${l.size}px`));
      assertClear(drawn);
    });

    it("a dense scatter hides some labels and shows the rest without overlap", async () => {
      const drawn = await draw(denseScatter, renderer, scatterNames);
      assert.strictEqual(drawn.circles.length, scatterNames.length);
      const shown = drawn.labels.length;
      assert.ok(shown > 10, `${shown} labels shown`);
      assert.ok(shown < scatterNames.length - 20, `${shown} labels shown`);
      assertClear(drawn);
    });

    it('labelPosition "inside" keeps every label inside its node', async () => {
      const drawn = await draw(
        d3plus => smallNetwork(d3plus).sizeMax(14).labelPosition("inside"),
        renderer,
        NAMES,
      );
      assert.strictEqual(beside(drawn.labels).length, 0);
      assert.ok(drawn.labels.length > 0, "inside labels still draw");
      for (const l of drawn.labels) {
        const c = drawn.circles.find(n => n.id === l.text);
        const cx = l.x + l.width / 2,
          cy = l.y + l.height / 2;
        assert.ok(Math.hypot(cx - c.x, cy - c.y) < c.r, `${l.text} inside`);
      }
      // Inside, labels shrink as far as Network's fontMin (1px) lets them.
      assert.ok(drawn.labels.some(l => l.size < 10));
    });

    it('labelPosition "outside" moves even a big node\'s label beside it', async () => {
      const drawn = await draw(
        d3plus => hubNetwork(d3plus).labelPosition("outside"),
        renderer,
        NAMES,
      );
      const label = drawn.labels.find(l => l.text === "Summit");
      assert.ok(label && label.interactive === false, "beside the hub");
      assertClear(drawn);
    });

    it("labels beside their circles take the chart's ink, light on a dark theme", async () => {
      const light = await draw(smallNetwork, renderer, NAMES);
      const dark = await draw(
        d3plus => smallNetwork(d3plus).theme("dark"),
        renderer,
        NAMES,
      );
      const lightFills = beside(light.labels).map(l => l.fill);
      const darkFills = beside(dark.labels).map(l => l.fill);
      assert.ok(lightFills.length && darkFills.length);
      lightFills.forEach(f => assert.ok(lightness(f) < 0.5, `${f} on light`));
      darkFills.forEach(f => assert.ok(lightness(f) > 0.5, `${f} on dark`));
    });

    it("small multiples place each panel's labels inside that panel", async () => {
      const drawn = await draw(
        d3plus =>
          denseScatter(d3plus).facet(d =>
            Number(d.id.slice(1)) % 2 ? "Odd" : "Even",
          ),
        renderer,
        scatterNames,
        [800, 400],
      );
      const out = beside(drawn.labels);
      assert.ok(out.some(l => l.x < 400) && out.some(l => l.x > 400));
      assertClear(drawn);
    });

    it("a zoomed Plot places its labels again for the new scales", async () => {
      const zoomed = await render(
        '<div id="viz" style="width:600px;height:400px"></div>',
        ([renderer, names]) =>
          new Promise(resolve => {
            const viz = denseScatter(window.d3plus)
              .zoom(true)
              .renderer(renderer)
              .width(600)
              .height(400)
              .duration(0)
              .legend(false)
              .select("#viz");
            viz.render(() => {
              const before = collect(viz, names);
              for (let i = 0; i < 3; i++)
                document.querySelector("#viz .zoom-in").click();
              setTimeout(() => {
                const area = viz._plotArea;
                const chart = viz._chartTransform || {x: 0, y: 0};
                resolve({
                  before,
                  after: collect(viz, names),
                  plot: {
                    x: chart.x + area.x,
                    y: chart.y + area.y,
                    width: area.width,
                    height: area.height,
                  },
                });
              }, 400);
            });
          }),
        [renderer, scatterNames],
      );
      const {before, after, plot} = zoomed;
      // Zoomed in, the cluster spreads out, so points that had no room get labels.
      const had = new Set(before.labels.map(l => l.text));
      const gained = beside(after.labels).filter(l => !had.has(l.text));
      assert.ok(gained.length > 0, `${gained.length} labels gained room`);
      for (const l of beside(after.labels)) {
        assert.ok(
          l.x >= plot.x - 1 && l.x + l.width <= plot.x + plot.width + 1,
        );
        assert.ok(
          l.y >= plot.y - 1 && l.y + l.height <= plot.y + plot.height + 1,
        );
      }
      // Circles scrolled off by the zoom are no obstacles in view; the
      // labels still clear every circle still in the plot.
      const inView = after.circles.filter(
        c =>
          c.x >= plot.x &&
          c.x <= plot.x + plot.width &&
          c.y >= plot.y &&
          c.y <= plot.y + plot.height,
      );
      assertClear({circles: inView, labels: after.labels});
    });

    it("Geomap points label beside each point", async () => {
      const cities = [
        {id: "Boston", point: [-71.06, 42.36]},
        {id: "Providence", point: [-71.41, 41.82]},
        {id: "Hartford", point: [-72.68, 41.76]},
        {id: "Portland", point: [-70.26, 43.66]},
      ];
      const drawn = await draw(
        d3plus =>
          new d3plus.Geomap()
            .data(cities)
            .groupBy("id")
            .tiles(false)
            .topojson(region),
        renderer,
        cities.map(c => c.id),
      );
      assert.strictEqual(drawn.circles.length, cities.length);
      assert.ok(beside(drawn.labels).length >= 3, "points are labeled");
      assertClear(drawn);
    });
  });

  it(`circle labels (${renderer}) take no hover and no keyboard focus`, async () => {
    const {page, errors, close} = await openPage(
      '<div id="viz" style="width:600px;height:400px"></div>',
    );
    try {
      const {nodes, links} = networkData();
      const found = await page.evaluate(
        ([renderer, nodes, links]) =>
          new Promise(resolve => {
            const viz = new window.d3plus.Network()
              .nodes(nodes)
              .links(links)
              .sizeMax(5)
              .hoverDistance(0)
              .renderer(renderer)
              .duration(0)
              .legend(false)
              .select("#viz");
            window.__viz = viz;
            viz.render(() => {
              let label = null;
              const walk = (n, x, y) => {
                const t = n.transform || {};
                const nx = x + (t.x || 0),
                  ny = y + (t.y || 0);
                if (!label && n.type === "text" && n.interactive === false)
                  label = {x: nx + n.width / 2, y: ny + n.height / 2};
                (n.children || []).forEach(c => walk(c, nx, ny));
              };
              walk(viz._paintedScene.root, 0, 0);
              const targets = window.d3plus.focusTargets(
                viz._paintedScene.root.children,
              );
              const host =
                document.querySelector("#viz svg") ||
                document.querySelector("#viz canvas");
              const box = host.getBoundingClientRect();
              resolve({
                point: label && [box.left + label.x, box.top + label.y],
                textTargets: targets.filter(t => t.node.type === "text").length,
                targets: targets.length,
              });
            });
          }),
        [renderer, nodes, links],
      );
      assert.ok(found.point, "a label sits beside a node");
      assert.ok(found.targets > 0, "the nodes are focus targets");
      assert.strictEqual(found.textTargets, 0, "no label is a focus target");
      await page.mouse.move(found.point[0] - 3, found.point[1] - 3);
      await page.mouse.move(...found.point, {steps: 3});
      await page.waitForTimeout(150);
      const state = await page.evaluate(() => {
        const tips = Array.from(document.querySelectorAll(".d3plus-tooltip"))
          .filter(el => getComputedStyle(el).opacity !== "0")
          .map(el => el.textContent);
        return {tips, hover: typeof window.__viz._hover === "function"};
      });
      assert.deepStrictEqual(state.tips, [], "no tooltip over a label");
      assert.strictEqual(state.hover, false, "nothing hovered");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
