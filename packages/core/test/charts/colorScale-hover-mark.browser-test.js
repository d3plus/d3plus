import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    #770: hovering a chart shape marks its colorScale value on the
    colorScale: an extra axis tick at the value on the color bar, and a
    badge reading it where that tick's label would sit, the tick running
    from the bar to the badge. A scale drawn as
    discrete swatches outlines the value's swatch and points at it. The mark
    clears on leaving the shape, never shows for chrome or a missing value,
    and `colorScaleConfig.hoverMark: false` turns it off.
*/

const trees = ["Ash", "Birch", "Cedar", "Elm", "Fir", "Maple", "Oak", "Pine"];
const values = [12, 45, 23, 67, 89, 34, 150, 56];
const forest = trees.map((id, i) => ({id, value: values[i]}));

/**
    Opens a page and renders a chart built by `src` (`lib => viz`) into a
    640×400 #viz, kept as `window.__viz`.
*/
async function chart(src, renderer, body = "") {
  const opened = await openPage(
    `<div id="viz" style="width:640px;height:400px;font-family:sans-serif;${body}"></div>`,
  );
  await opened.page.evaluate(
    ([src, renderer]) =>
      new Promise(resolve => {
        const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus);
        window.__viz = viz;
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [src, renderer],
  );
  return opened;
}

/**
    The client point at the center of the first painted scene node matching
    `match` (a `node => boolean` source), or `null`. Group transforms are
    composed; a path's box is read off its absolute coordinates.
*/
function pointOf(page, match) {
  return page.evaluate(match => {
    const test = new Function("node", `return (${match})(node);`);
    // Maps a scene point to the client: through the painted svg's screen
    // matrix, or the canvas's box.
    const toClient = ([x, y]) => {
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      if (svg) {
        const m = svg.getScreenCTM();
        return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
      }
      const r = document.querySelector("#viz canvas").getBoundingClientRect();
      return [r.left + x, r.top + y];
    };
    const viz = window.__viz;
    const box = node => {
      if (node.type === "rect")
        return [node.x, node.y, node.x + node.width, node.y + node.height];
      if (node.type === "circle")
        return [
          node.cx - node.r,
          node.cy - node.r,
          node.cx + node.r,
          node.cy + node.r,
        ];
      if (node.type === "path") {
        const n = (node.d.match(/-?[\d.]+(e-?\d+)?/g) || []).map(Number);
        const xs = n.filter((_, i) => i % 2 === 0);
        const ys = n.filter((_, i) => i % 2 === 1);
        return [
          Math.min(...xs),
          Math.min(...ys),
          Math.max(...xs),
          Math.max(...ys),
        ];
      }
      return null;
    };
    const apply = (chain, [x, y]) =>
      chain.reduceRight(
        ([px, py], t) => [
          px * (t.scale ?? 1) + (t.x ?? 0),
          py * (t.scale ?? 1) + (t.y ?? 0),
        ],
        [x, y],
      );
    let found = null;
    const walk = (node, chain) => {
      if (found) return;
      const next = node.transform ? [...chain, node.transform] : chain;
      if (
        node.type !== "group" &&
        !String(node.key).endsWith("::hit") &&
        node.datum &&
        test(node)
      ) {
        const b = box(node);
        if (b) found = apply(next, [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]);
      }
      (node.children || []).forEach(c => walk(c, next));
    };
    walk(viz._paintedScene.root, []);
    if (!found) return null;
    return toClient(found);
  }, match);
}

/** Moves the real mouse to `point` and waits for the hover repaint. */
async function hover(page, point) {
  await page.mouse.move(point[0] - 3, point[1] - 3);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(80);
}

/** What the colorScale draws for the hovered value, read off the painted scene. */
function mark(page) {
  return page.evaluate(() => {
    const viz = window.__viz;
    const cs = viz._colorScaleClass;
    const out = {
      value: cs.hover(),
      pointer: null,
      tick: null,
      badge: null,
      badgeFont: null,
      axis: null,
      labelNear: null,
      badgeBox: null,
      outline: null,
      outlined: [],
      swatches: [],
      geometry: null,
      expected: null,
      color: null,
    };
    const bucketOf = n => {
      let d = n.datum;
      while (d && d.__d3plus__ && d.data) d = d.data;
      return d && d._isColorScaleBucket ? d : null;
    };
    const walk = node => {
      const key = String(node.key);
      if (key.endsWith("-hover-pointer"))
        out.pointer = {
          tip: node.d.slice(1).split("L")[0].split(",").map(Number),
          fill: node.paint.fill,
          interactive: node.interactive,
        };
      else if (key.endsWith("-hover-tick"))
        out.tick = {
          start: node.points[0],
          end: node.points[1],
          stroke: node.paint.stroke,
          strokeWidth: node.paint.strokeWidth,
          interactive: node.interactive,
        };
      else if (key.endsWith("-hover-badge-text")) {
        out.badge = node.lines.map(l => l.text).join("");
        out.badgeFont = node.font.size;
      } else if (key.endsWith("-hover-badge-box"))
        out.badgeBox = {
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          fill: node.paint.fill,
        };
      else if (key.endsWith("-hover-outline"))
        out.outline = {x: node.x, y: node.y, w: node.width, h: node.height};
      else if (
        node.type !== "group" &&
        node.type !== "text" &&
        !key.endsWith("::hit") &&
        bucketOf(node) &&
        node.paint &&
        node.paint.strokeWidth === 2
      )
        out.outlined.push(bucketOf(node).color);
      if (node.type === "rect" && !key.endsWith("::hit") && bucketOf(node))
        out.swatches.push({
          color: bucketOf(node).color,
          opacity: node.paint.opacity ?? 1,
        });
      (node.children || []).forEach(walk);
    };
    walk(viz._paintedScene.root);
    // The axis's tick paint and the near edge (x) of its first tick label,
    // in the ColorScale's own space.
    const scale = viz._paintedScene.root.children.find(
      n => n.key === "viz-colorScale",
    );
    const local = (node, chain, inAxis) => {
      const t = node.transform || {};
      const at = [chain[0] + (t.x || 0), chain[1] + (t.y || 0)];
      const axis = inAxis || String(node.key).startsWith("Axis-");
      if (
        axis &&
        node.type === "path" &&
        !String(node.key).endsWith("::hit") &&
        !out.axis
      )
        out.axis = {
          stroke: node.paint.stroke,
          strokeWidth: node.paint.strokeWidth,
        };
      if (axis && node.type === "text" && out.labelNear === null)
        out.labelNear = at[0] + node.x + node.lines[0].x;
      (node.children || []).forEach(c => local(c, at, axis));
    };
    const root = scale && scale.children[0];
    if (root) (root.children || []).forEach(c => local(c, [0, 0], false));
    out.tickSize = cs._axisClass.schema.tickSize;
    out.labelGap = cs._axisClass.schema.tickSize + cs._axisClass.schema.padding;
    const g = cs._barGeometry;
    if (g) {
      out.geometry = {orient: g.orient, cross: g.cross, range: g.range};
      if (typeof out.value === "number") {
        const lo = Math.min(...g.domain);
        const hi = Math.max(...g.domain);
        out.expected = g.position(Math.min(hi, Math.max(lo, out.value)));
      }
    }
    if (typeof out.value === "number") out.color = cs._colorScale(out.value);
    return out;
  });
}

const treemap = (config = "") => `lib => new lib.Treemap()
  .data(${JSON.stringify(forest)})
  .sum("value")
  .colorScale("value")
  .colorScalePosition("bottom")
  ${config}`;

/** A Treemap tile, matched by its row's id. */
const tile = id =>
  `n => n.type === "rect" && n.datum.id === ${JSON.stringify(id)}`;

const near = (a, b, message) =>
  assert.ok(Math.abs(a - b) < 0.75, `${message}: ${a} ≈ ${b}`);

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: hovering a tile ticks its value on the color bar and reads it`, async () => {
    const {page, close} = await chart(
      treemap(
        `.colorScaleConfig({scale: "linear"}).colorScalePosition("bottom")`,
      ),
      renderer,
    );
    try {
      assert.strictEqual((await mark(page)).tick, null, "no mark at rest");
      await hover(page, await pointOf(page, tile("Maple")));
      const m = await mark(page);
      assert.strictEqual(m.value, 34);
      assert.strictEqual(m.pointer, null, "no pointer");
      assert.ok(m.tick, "draws a tick");
      assert.strictEqual(m.tick.interactive, false, "the tick is inert");
      near(m.tick.start[0], m.expected, "the tick sits at the value");
      near(m.tick.end[0], m.expected, "and stays straight");
      near(m.tick.start[1], m.geometry.cross[1], "from the bar's labels edge");
      near(m.tick.end[1] - m.tick.start[1], m.tickSize, "as long as a tick");
      assert.deepStrictEqual(
        {stroke: m.tick.stroke, strokeWidth: m.tick.strokeWidth},
        m.axis,
        "styled like the axis ticks",
      );
      assert.strictEqual(m.badge, "34", "the badge reads the value");
      near(m.badgeBox.y, m.tick.end[1], "the tick reaches the badge");
      near(
        m.badgeBox.y +
          (m.badgeBox.height - m.badgeFont) / 2 -
          m.geometry.cross[1],
        m.labelGap,
        "its text sits as far out as the tick labels",
      );
      assert.strictEqual(m.badgeBox.fill, m.color, "filled with its color");
      assert.strictEqual(m.outline, null, "a smooth bar outlines nothing");

      await hover(page, await pointOf(page, tile("Oak")));
      const oak = await mark(page);
      assert.strictEqual(
        oak.value,
        150,
        "follows the pointer to the next tile",
      );
      near(oak.tick.start[0], oak.expected, "and moves with it");

      await page.mouse.move(2, 2);
      await page.waitForTimeout(80);
      const left = await mark(page);
      assert.strictEqual(left.value, false, "leaving the chart clears it");
      assert.strictEqual(left.tick, null);
      assert.strictEqual(left.badge, null);
    } finally {
      await close();
    }
  });

  it(`${renderer}: a discrete scale draws no mark, the hover highlight lights the value's swatch`, async () => {
    const {page, close} = await chart(
      treemap(
        `.colorScaleConfig({scale: "jenks"}).colorScalePosition("bottom")`,
      ),
      renderer,
    );
    try {
      await hover(page, await pointOf(page, tile("Maple")));
      const m = await mark(page);
      assert.strictEqual(m.tick, null, "no tick");
      assert.strictEqual(m.pointer, null, "no pointer");
      assert.strictEqual(m.badge, null, "no badge");
      assert.deepStrictEqual(m.outlined, [], "no outline");
      const lit = m.swatches.filter(d => d.opacity === 1).map(d => d.color);
      assert.deepStrictEqual(
        lit,
        [m.color],
        "only the value's swatch stays lit",
      );
      assert.ok(m.swatches.length > 2, "the others dim");

      const swatch = await pointOf(
        page,
        `n => n.type === "rect" && (d => { while (d && d.__d3plus__ && d.data) d = d.data; return d && d._isColorScaleBucket && d.color === ${JSON.stringify(m.color)}; })(n.datum)`,
      );
      await hover(page, swatch);
      const onSwatch = await mark(page);
      assert.strictEqual(
        onSwatch.value,
        false,
        "hovering a swatch marks nothing",
      );
      assert.strictEqual(onSwatch.tick, null);
    } finally {
      await close();
    }
  });

  it(`${renderer}: a bucketed bar outlines the value's bucket and ticks the exact value`, async () => {
    const {page, close} = await chart(
      treemap(
        `.colorScaleConfig({scale: "jenks", bucketAxis: true}).colorScalePosition("bottom")`,
      ),
      renderer,
    );
    try {
      await hover(page, await pointOf(page, tile("Elm")));
      const m = await mark(page);
      assert.strictEqual(m.value, 67);
      near(m.tick.start[0], m.expected, "the tick sits at the exact value");
      near(m.badgeBox.y, m.tick.end[1], "the tick reaches the badge");
      assert.ok(m.outline, "outlines the bucket");
      assert.ok(
        m.outline.x <= m.expected && m.outline.x + m.outline.w >= m.expected,
        "the outlined bucket holds the value",
      );
      assert.ok(m.outline.w < m.geometry.range[1] - m.geometry.range[0]);
    } finally {
      await close();
    }
  });
}

it("each colorScale position ticks toward the labels, the badge where a label sits", async () => {
  for (const position of ["top", "bottom", "left", "right"]) {
    const {page, close} = await chart(
      treemap(
        `.colorScaleConfig({scale: "linear"}).colorScalePosition(${JSON.stringify(position)})`,
      ),
      "svg",
    );
    try {
      await hover(page, await pointOf(page, tile("Fir")));
      const m = await mark(page);
      assert.strictEqual(m.value, 89, position);
      const [c0, c1] = m.geometry.cross;
      const vertical = position === "left" || position === "right";
      const flip = ([a, b]) => (vertical ? [b, a] : [a, b]);
      const [along, from] = flip(m.tick.start);
      const [, to] = flip(m.tick.end);
      near(along, m.expected, `${position}: at the value`);
      // The labels face away from the chart: the tick runs out toward them.
      const edge = {top: c0, bottom: c1, left: c0, right: c1}[position];
      const out = position === "top" || position === "left" ? -1 : 1;
      near(from, edge, `${position}: from the bar's labels edge`);
      near((to - from) * out, m.tickSize, `${position}: a tick long`);
      const box = m.badgeBox;
      const near0 = {
        bottom: box.y,
        top: box.y + box.height,
        right: box.x,
        left: box.x + box.width,
      }[position];
      near(near0, to, `${position}: the tick reaches the badge`);
      if (position === "right") {
        // Start-anchored labels: the badge's text starts where theirs do.
        const pad = m.labelGap - m.tickSize;
        near(box.x + pad, m.labelNear, "right: text in line with the labels");
        near(box.x + pad - c1, m.labelGap, "right: tick size plus padding out");
      }
    } finally {
      await close();
    }
  }
});

it("a value outside the domain clamps to the bar's end", async () => {
  const {page, close} = await chart(
    treemap(`.colorScaleConfig({scale: "linear", domain: [0, 100]})`),
    "svg",
  );
  try {
    await hover(page, await pointOf(page, tile("Oak")));
    const m = await mark(page);
    assert.strictEqual(m.value, 150);
    assert.strictEqual(m.badge, "150", "the badge reads the real value");
    near(m.tick.start[0], Math.max(...m.geometry.range), "pinned to the end");
    assert.ok(
      m.badgeBox.x <= m.tick.start[0] &&
        m.badgeBox.x + m.badgeBox.width >= m.tick.start[0],
      "the badge, held inside the scale, still meets the tick",
    );
  } finally {
    await close();
  }
});

it("a shape without a colorScale value shows no mark", async () => {
  const rows = forest.map(d => ({...d, rate: d.id === "Oak" ? null : d.value}));
  const {page, close} = await chart(
    `lib => new lib.Treemap()
      .data(${JSON.stringify(rows)})
      .sum("value")
      .colorScale("rate")
      .colorScalePosition("bottom")
      .colorScaleConfig({scale: "linear"})`,
    "svg",
  );
  try {
    await hover(page, await pointOf(page, tile("Fir")));
    assert.strictEqual((await mark(page)).value, 89);
    await hover(page, await pointOf(page, tile("Oak")));
    const m = await mark(page);
    assert.strictEqual(m.value, false, "a null value clears the mark");
    assert.strictEqual(m.tick, null);
  } finally {
    await close();
  }
});

it("hoverMark: false draws no mark", async () => {
  const {page, close} = await chart(
    treemap(`.colorScaleConfig({scale: "linear", hoverMark: false})`),
    "svg",
  );
  try {
    await hover(page, await pointOf(page, tile("Maple")));
    const m = await mark(page);
    assert.strictEqual(m.tick, null);
    assert.strictEqual(m.badge, null);
  } finally {
    await close();
  }
});

it("hovering a Geomap region marks its value", async () => {
  const {page, close} = await chart(
    `lib => new lib.Geomap()
      .groupBy("geo")
      .colorScale("value")
      .colorScalePosition("bottom")
      .colorScaleConfig({scale: "linear"})
      .tiles(false)
      .ocean("transparent")
      .topojson({
        type: "Topology",
        objects: {geo: {type: "GeometryCollection", geometries: [
          {type: "Polygon", id: "a", arcs: [[0]]},
          {type: "Polygon", id: "b", arcs: [[1]]},
        ]}},
        arcs: [
          [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
          [[20, 0], [20, 10], [30, 10], [30, 0], [20, 0]],
        ],
      })
      .data([{geo: "a", value: 10}, {geo: "b", value: 20}, {geo: "c", value: 35}])`,
    "canvas",
  );
  try {
    await hover(
      page,
      await pointOf(page, `n => n.type === "path" && n.datum.geo === "b"`),
    );
    const m = await mark(page);
    assert.strictEqual(m.value, 20);
    near(m.tick.start[0], m.expected, "at the region's value");
    assert.strictEqual(m.badge, "20");
  } finally {
    await close();
  }
});

/** A three-region Geomap colored by `value` through `config`. */
const geomap = config => `lib => new lib.Geomap()
  .groupBy("geo")
  .colorScale("value")
  .colorScalePosition("bottom")
  .colorScaleConfig(${config})
  .tiles(false)
  .ocean("transparent")
  .topojson({
    type: "Topology",
    objects: {geo: {type: "GeometryCollection", geometries: [
      {type: "Polygon", id: "a", arcs: [[0]]},
      {type: "Polygon", id: "b", arcs: [[1]]},
      {type: "Polygon", id: "c", arcs: [[2]]},
    ]}},
    arcs: [
      [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
      [[20, 0], [20, 10], [30, 10], [30, 0], [20, 0]],
      [[40, 0], [40, 10], [50, 10], [50, 0], [40, 0]],
    ],
  })
  .data([{geo: "a", value: 10}, {geo: "b", value: 20}, {geo: "c", value: 95}])`;

/** The painted opacity of every chart mark matching `match` (a `node => boolean` source). */
function markOpacities(page, match) {
  return page.evaluate(match => {
    const test = new Function("node", `return (${match})(node);`);
    const out = [];
    const walk = n => {
      if (
        n.type !== "group" &&
        !String(n.key).endsWith("::hit") &&
        n.datum &&
        test(n)
      )
        out.push(n.paint.opacity ?? 1);
      (n.children || []).forEach(walk);
    };
    const cells = window.__viz._paintedScene.root.children.find(
      n => n.key === "viz-chart-cells",
    );
    walk(cells);
    return out;
  }, match);
}

const region = id =>
  `n => n.type === "path" && n.datum.geo === ${JSON.stringify(id)}`;

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: hovering a Geomap region lights its jenks swatch, not dimming the map`, async () => {
    const {page, close} = await chart(geomap(`{scale: "jenks"}`), renderer);
    try {
      await hover(page, await pointOf(page, region("b")));
      const m = await mark(page);
      assert.strictEqual(m.value, 20);
      assert.strictEqual(m.tick, null, "no tick on swatches");
      const lit = m.swatches.filter(d => d.opacity === 1).map(d => d.color);
      assert.deepStrictEqual(lit, [m.color], "only its swatch stays lit");
      assert.ok(
        m.swatches.filter(d => d.opacity === 0.5).length ===
          m.swatches.length - 1,
        "the others dim to 0.5",
      );
      const regions = await markOpacities(
        page,
        `n => n.type === "path" && n.datum.geo`,
      );
      assert.ok(regions.length >= 3);
      assert.ok(
        regions.every(o => o === 1),
        "no region dims",
      );

      await page.mouse.move(2, 2);
      await page.waitForTimeout(80);
      const left = await mark(page);
      assert.ok(
        left.swatches.every(d => d.opacity === 1),
        "leaving clears it",
      );
    } finally {
      await close();
    }
  });
}

it("hoverMark: false leaves a Geomap's swatches unlit on region hover", async () => {
  const {page, close} = await chart(
    geomap(`{scale: "jenks", hoverMark: false}`),
    "svg",
  );
  try {
    await hover(page, await pointOf(page, region("b")));
    const m = await mark(page);
    assert.ok(m.swatches.length > 1);
    assert.ok(
      m.swatches.every(d => d.opacity === 1),
      "no swatch dims",
    );
  } finally {
    await close();
  }
});

it("past dataCutoff, hovering a tile lights its swatch without dimming tiles", async () => {
  const {page, close} = await chart(
    treemap(`.colorScaleConfig({scale: "jenks"}).dataCutoff(3)`),
    "svg",
  );
  try {
    await hover(page, await pointOf(page, tile("Fir")));
    const m = await mark(page);
    assert.strictEqual(m.value, 89);
    const lit = m.swatches.filter(d => d.opacity === 1).map(d => d.color);
    assert.deepStrictEqual(lit, [m.color], "only its swatch stays lit");
    const tiles = await markOpacities(
      page,
      `n => n.type === "rect" && n.datum.id`,
    );
    assert.ok(
      tiles.every(o => o === 1),
      "no tile dims",
    );
  } finally {
    await close();
  }
});

it("hovering a line marks the value its color came from", async () => {
  const rows = ["a", "b"].flatMap(id =>
    [1, 2, 3].map(x => ({
      id,
      x,
      y: x * (id === "a" ? 1 : 2),
      rate: id === "a" ? 5 : 40,
    })),
  );
  const {page, close} = await chart(
    `lib => new lib.LinePlot()
      .data(${JSON.stringify(rows)})
      .x("x")
      .y("y")
      .colorScale("rate")
      .colorScaleConfig({scale: "linear"})`,
    "svg",
  );
  try {
    // Halfway along the drawn line.
    const point = await page.evaluate(() => {
      const path = document.querySelector('#viz path[data-key="b"]');
      const p = path.getPointAtLength(path.getTotalLength() / 2);
      const m = path.getScreenCTM();
      return [m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f];
    });
    await hover(page, point);
    const m = await mark(page);
    const fill = await page.evaluate(() => {
      const viz = window.__viz;
      let line = null;
      const walk = n => {
        if (
          n.type === "path" &&
          n.datum &&
          n.datum.__d3plus__ &&
          n.datum.id === "b"
        )
          line = n;
        (n.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      let d = line.datum;
      while (d.__d3plus__ && d.data) d = d.data;
      return viz.schema.colorScale(d);
    });
    assert.strictEqual(m.value, fill, "the line's own colorScale value");
    assert.ok(m.tick);
  } finally {
    await close();
  }
});

it("small multiples mark the hovered panel's tile", async () => {
  const rows = forest.flatMap(d => [
    {...d, region: "North"},
    {...d, region: "South", value: d.value * 2},
  ]);
  const {page, close} = await chart(
    `lib => new lib.Treemap()
      .data(${JSON.stringify(rows)})
      .sum("value")
      .facet("region")
      .colorScale("value")
      .colorScalePosition("bottom")
      .colorScaleConfig({scale: "linear"})`,
    "svg",
  );
  try {
    await hover(
      page,
      await pointOf(
        page,
        `n => n.type === "rect" && n.datum.id === "Maple" && n.datum.region === "South"`,
      ),
    );
    const m = await mark(page);
    assert.strictEqual(m.value, 68);
    near(m.tick.start[0], m.expected, "at the South tile's value");
  } finally {
    await close();
  }
});

it("re-rendering clears the mark", async () => {
  const {page, close} = await chart(
    treemap(`.colorScaleConfig({scale: "linear"})`),
    "svg",
  );
  try {
    await hover(page, await pointOf(page, tile("Maple")));
    assert.strictEqual((await mark(page)).value, 34);
    await page.evaluate(
      () => new Promise(resolve => window.__viz.render(resolve)),
    );
    assert.strictEqual((await mark(page)).value, false);
  } finally {
    await close();
  }
});
