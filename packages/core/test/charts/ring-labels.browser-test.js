import {it} from "vitest";
import {pathTextBoxes} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {labelsOverlap} from "../../src/charts/features/linkLabelGeometry.ts";
import {textLineBoxes} from "../../src/charts/features/linkLabels.ts";

/**
    Curved ring labels in a real browser, on both renderers: a Donut's and a
    Sunburst's names follow their arcs inside the ring band, read upright,
    never overlap, dim with their segment, and are no focus target; a
    Chord's curve around the outside in the theme's ink; a full-circle
    RadialBar names its tracks; and a redraw fades the labels rather than
    sliding them while the arcs tween, or redraws them in place without
    motion.
*/

const sectors = [
  {id: "Manufacturing", value: 31},
  {id: "Retail Trade", value: 22},
  {id: "Health Care", value: 16},
  {id: "Construction", value: 11},
  {id: "Education", value: 7},
  {id: "Agriculture", value: 4},
  {id: "Mining", value: 2.5},
];

const files = [
  ["Frontend", "Components", "Table", 410],
  ["Frontend", "Components", "Modal", 240],
  ["Frontend", "Pages", "Dashboard", 520],
  ["Frontend", "Pages", "Settings", 180],
  ["Backend", "API", "Users", 330],
  ["Backend", "API", "Orders", 460],
  ["Backend", "Database", "Migrations", 380],
  ["Docs", "Reference", "API Reference", 260],
].map(([area, module, file, size]) => ({area, module, file, size}));

const regions = ["North America", "Europe", "East Asia", "Africa", "Oceania"];
const flows = regions.flatMap((s, i) =>
  regions
    .filter((_t, j) => j !== i)
    .map((t, j) => ({
      source: s,
      target: t,
      value: (((i + 2) * (j + 3)) % 7) + 2,
    })),
);

const charts = {
  Donut: {data: sectors, groupBy: "id"},
  Sunburst: {data: files, groupBy: ["area", "module", "file"], sum: "size"},
  Chord: {links: flows, value: "value"},
  RadialBar: {
    data: sectors.slice(0, 4),
    groupBy: "id",
    maxAngle: 360,
  },
};

/** Every text node of a scene, with its offset and its parent's, and every arc path. */
function collect(root) {
  const texts = [];
  const arcs = [];
  const walk = (n, ox, oy) => {
    const t = n.transform || {};
    const x = ox + (t.x || 0),
      y = oy + (t.y || 0);
    // Its parent's offset too: textLineBoxes applies a node's own transform.
    if (n.type === "text") texts.push({n, x, y, ox, oy});
    if (n.type === "path" && n.datum && !`${n.key}`.endsWith("::hit"))
      arcs.push({n, x, y});
    (n.children || []).forEach(c => walk(c, x, y));
  };
  walk(root, 0, 0);
  return {texts, arcs};
}

/**
    Draws `type` with `config` and resolves with its curved labels: their
    text, fill, datum, interactivity and glyph boxes (around the ring's
    center), each with the radii and angles of its segment's arc; every
    label's boxes; the count of SVG textPaths; and how many focus targets
    are text.
*/
const draw = ([type, config, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[type]()
      .config(config)
      .renderer(renderer)
      .width(600)
      .height(500)
      .duration(0)
      .legend(false)
      .select("#viz");
    window.__viz = viz;
    viz.render(() => {
      const {texts, arcs} = collect(viz._paintedScene.root);
      // A Chord's group arcs are plain paths: their extent is in the layout.
      const chord = viz.ctx.chordCtx;
      const arcOf = datum => {
        const found = arcs.find(a => a.n.datum === datum);
        if (!found || found.n.arc || !chord) return found;
        const node = chord.nodes.find(nd => nd.data === datum);
        const [mx, my] = found.n.d.match(/M(-?[\d.]+),(-?[\d.]+)/).slice(1);
        const outerRadius = Math.hypot(+mx, +my);
        return {
          ...found,
          n: {
            arc: {
              innerRadius: outerRadius - viz.schema.arcThickness,
              outerRadius,
              startAngle: node.group.startAngle,
              endAngle: node.group.endAngle,
            },
          },
        };
      };
      const curved = texts
        .filter(({n}) => n.path)
        .map(({n, x, y}) => {
          const arc = arcOf(n.datum);
          return {
            text: n.lines[0].text,
            fontSize: n.font.size,
            fill: n.paint.fill,
            hasDatum: n.datum !== undefined,
            interactive: n.interactive,
            ariaHidden: n.aria?.hidden === true,
            arc: arc && {...arc.n.arc},
            boxes: pathTextBoxes(n).map(b => ({
              ...b,
              x: b.x + x - (arc ? arc.x : 0),
              y: b.y + y - (arc ? arc.y : 0),
            })),
          };
        });
      const boxes = texts.map(({n, ox, oy}) =>
        textLineBoxes([n]).map(b => ({...b, x: b.x + ox, y: b.y + oy})),
      );
      const targets = window.d3plus.focusTargets(
        viz._paintedScene.root.children,
      );
      resolve({
        curved,
        boxes,
        texts: texts.map(({n}) => n.lines.map(l => l.text).join(" ")),
        textPaths: document.querySelectorAll("#viz textPath").length,
        textTargets: targets.filter(t => t.node.type === "text").length,
        targets: targets.length,
      });
    });
  });

const run = (type, renderer, extra = {}) =>
  render('<div id="viz"></div>', draw, [
    type,
    {...charts[type], ...extra},
    renderer,
  ]);

const TAU = Math.PI * 2;
const norm = a => ((a % TAU) + TAU) % TAU;
/** Whether angle `a` lies within `[start, end]`, wrapping around the circle. */
const within = (a, start, end, tol = 0.02) =>
  norm(a - start + tol) <= end - start + 2 * tol;
const luminance = color => {
  const m = color.match(/\d+/g) ?? [];
  const hex = color.startsWith("#")
    ? [1, 3, 5].map(k => parseInt(color.slice(k, k + 2), 16))
    : m.slice(0, 3).map(Number);
  return (0.299 * hex[0] + 0.587 * hex[1] + 0.114 * hex[2]) / 255;
};

/** Asserts the curved labels sit inside their arcs' bands, upright, and nothing overlaps. */
/** Asserts each curved label's glyphs keep 0.3em from its segment's ends and pad, and clear of its ring's edges. */
function assertInset(out, label) {
  for (const c of out.curved) {
    const fs = c.fontSize;
    const pad =
      ((c.arc.padAngle || 0) / 2) *
      Math.hypot(c.arc.innerRadius, c.arc.outerRadius);
    for (const b of c.boxes) {
      const rad = (b.angle * Math.PI) / 180;
      const [ux, uy] = [Math.cos(rad), Math.sin(rad)];
      for (const [su, sv] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]) {
        const x = b.x + (su * b.width * ux) / 2 - (sv * b.height * uy) / 2;
        const y = b.y + (su * b.width * uy) / 2 + (sv * b.height * ux) / 2;
        const r = Math.hypot(x, y);
        assert.ok(
          r >= c.arc.innerRadius + 3 && r <= c.arc.outerRadius - 3,
          `${label}: ${c.text} at radius ${r.toFixed(1)} of [${c.arc.innerRadius.toFixed(1)}, ${c.arc.outerRadius.toFixed(1)}]`,
        );
        const a = Math.atan2(x, -y);
        const from = norm(a - c.arc.startAngle);
        const to = norm(c.arc.endAngle - a);
        const edge = Math.min(from, to) * r - pad;
        assert.ok(
          edge >= 0.3 * fs - 1,
          `${label}: ${c.text} ${edge.toFixed(1)}px from an end at ${fs}px`,
        );
      }
    }
  }
}

function assertRingLabels(out, label) {
  assert.ok(out.curved.length > 0, `${label}: some labels curve`);
  for (const c of out.curved) {
    assert.ok(c.arc, `${label}: ${c.text} has an arc`);
    for (const b of c.boxes) {
      const r = Math.hypot(b.x, b.y);
      assert.ok(
        r >= c.arc.innerRadius - 0.5 && r <= c.arc.outerRadius + 0.5,
        `${label}: ${c.text} at radius ${r} in [${c.arc.innerRadius}, ${c.arc.outerRadius}]`,
      );
      const a = Math.atan2(b.x, -b.y);
      assert.ok(
        within(a, c.arc.startAngle, c.arc.endAngle),
        `${label}: ${c.text} at angle ${a}`,
      );
    }
    // Upright: the text reads left to right, or up the page, at its middle.
    const length = c.boxes.reduce((sum, b) => sum + b.width, 0);
    const turn =
      c.boxes.reduce((sum, b) => sum + b.angle * b.width, 0) / length;
    assert.ok(
      turn >= -90.5 && turn <= 90.5,
      `${label}: ${c.text} turned ${turn}°`,
    );
    assert.strictEqual(
      c.hasDatum,
      true,
      `${label}: ${c.text} dims with its arc`,
    );
    assert.strictEqual(c.interactive, false);
    assert.strictEqual(c.ariaHidden, true);
  }
  const all = out.boxes;
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++)
      for (const a of all[i])
        for (const b of all[j])
          assert.ok(
            !labelsOverlap(a, b),
            `${label}: labels ${i} and ${j} overlap`,
          );
  assert.strictEqual(
    out.textTargets,
    0,
    `${label}: no label is a focus target`,
  );
  assert.ok(out.targets > 0, `${label}: the arcs are focus targets`);
}

for (const renderer of ["svg", "canvas"]) {
  it(`Donut: names curve inside the ring, upright and apart (${renderer})`, async () => {
    const out = await run("Donut", renderer);
    assertRingLabels(out, "Donut");
    assertInset(out, "Donut");
    const names = out.curved.map(c => c.text);
    assert.ok(names.includes("Manufacturing"), names.join());
    if (renderer === "svg")
      assert.strictEqual(out.textPaths, out.curved.length, "SVG textPaths");
  });

  it(`Sunburst: wide arcs curve, every label stays in its arc (${renderer})`, async () => {
    const out = await run("Sunburst", renderer);
    assertRingLabels(out, "Sunburst");
    assertInset(out, "Sunburst");
    const names = out.curved.map(c => c.text);
    assert.ok(names.includes("Frontend"), names.join());
    // Backend's arc is on the bottom half, where its letters would face the
    // center: it curves only 4em out, so at its largest it may stay straight.
    assert.ok(out.texts.includes("Backend"), out.texts.join());
  });

  it(`RadialBar: a full circle names its tracks along them (${renderer})`, async () => {
    const out = await run("RadialBar", renderer);
    assert.deepStrictEqual(
      out.curved.map(c => c.text),
      ["Manufacturing", "Retail Trade", "Health Care", "Construction"],
    );
    for (const c of out.curved)
      assert.ok(luminance(c.fill) > 0.9, `${c.text} light on its bar`);
  });

  it(`Chord: names curve outside the ring in the theme's ink (${renderer})`, async () => {
    for (const theme of ["light", "dark"]) {
      const out = await run("Chord", renderer, {theme});
      assert.strictEqual(out.curved.length, regions.length);
      for (const c of out.curved) {
        assert.ok(c.arc, `${c.text} has an arc`);
        for (const b of c.boxes)
          assert.ok(Math.hypot(b.x, b.y) > c.arc.outerRadius, "outside");
        const l = luminance(c.fill);
        assert.ok(
          theme === "dark" ? l > 0.7 : l < 0.4,
          `${theme}: ${c.text} in ${c.fill}`,
        );
      }
    }
  });

  it(`Donut: labels dim with their slice on hover (${renderer})`, async () => {
    const out = await render(
      '<div id="viz"></div>',
      ([config, renderer]) =>
        new Promise(resolve => {
          const viz = new window.d3plus.Donut()
            .config(config)
            .renderer(renderer)
            .width(600)
            .height(500)
            .duration(0)
            .legend(false)
            .select("#viz");
          viz.render(async () => {
            viz.hover(d => d.id === "Manufacturing");
            for (let i = 0; i < 3; i++)
              await new Promise(r => requestAnimationFrame(() => r()));
            const opacity = {};
            const walk = (n, o) => {
              const op = o * (n.paint?.opacity ?? 1);
              // Curved or straight, each label by its whole text.
              if (n.type === "text")
                opacity[n.lines.map(l => l.text).join(" ")] = op;
              (n.children || []).forEach(c => walk(c, op));
            };
            walk(viz._paintedScene.root, 1);
            resolve(opacity);
          });
        }),
      [charts.Donut, renderer],
    );
    assert.strictEqual(out.Manufacturing, 1, "the hovered slice's label");
    assert.ok(out["Retail Trade"] < 1, `dimmed: ${out["Retail Trade"]}`);
  });
}

/** Draws a RadialBar and resolves with its curved labels and whether its legend shows. */
const drawRadialBar = ([config, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.RadialBar()
      .config(config)
      .renderer(renderer)
      .width(600)
      .height(500)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const nodes = [];
      const walk = n => {
        nodes.push(n);
        (n.children || []).forEach(walk);
      };
      walk(viz.toScene().root);
      resolve({
        curved: nodes.filter(n => n.type === "text" && n.path).length,
        legend:
          nodes.some(n => n.key === "viz-legend") &&
          (viz._legendClass._lineData || []).length > 0,
      });
    });
  });

const tracks = (n, extra = {}) => ({
  data: Array.from({length: n}, (_v, k) => ({
    id: `Track ${k + 1}`,
    value: 90 - k * (80 / n),
  })),
  groupBy: "id",
  ...extra,
});

for (const renderer of ["svg", "canvas"]) {
  it(`RadialBar: curved labels naming every track hide the default legend (${renderer})`, async () => {
    const run = config =>
      render('<div id="viz"></div>', drawRadialBar, [config, renderer]);
    const full = await run(tracks(4, {maxAngle: 360}));
    assert.strictEqual(full.curved, 4);
    assert.strictEqual(full.legend, false, "full circle: no legend");
    const along = await run(tracks(4, {labelPosition: "along"}));
    assert.strictEqual(along.curved, 4);
    assert.strictEqual(along.legend, false, "along: no legend");
    const kept = await run(tracks(4, {maxAngle: 360, legend: true}));
    assert.strictEqual(kept.legend, true, "an explicit legend wins");
    const inside = await run(
      tracks(4, {maxAngle: 360, labelPosition: "inside"}),
    );
    assert.strictEqual(inside.curved, 0);
    assert.strictEqual(inside.legend, true, "no curved names: the legend");
    // Tracks too thin for their names leave them to the legend.
    const thin = await run(tracks(24, {maxAngle: 360}));
    assert.ok(thin.curved < 24, `${thin.curved} of 24 named`);
    assert.strictEqual(thin.legend, true, "an unnamed track keeps the legend");
  });
}

/**
    Redraws a Donut with new values and samples its "Manufacturing" label
    every frame of the transition: the path its text follows and its
    opacity.
*/
const redraw = ([config, reducedMotion]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Donut()
      .config({...config, duration: 400, reducedMotion})
      .width(600)
      .height(500)
      .legend(false)
      .select("#viz");
    const label = () => {
      const tp = [...document.querySelectorAll("#viz textPath")].find(
        el => el.textContent === "Manufacturing",
      );
      if (!tp) return null;
      const text = tp.closest("text");
      const href = tp.getAttribute("href") || tp.getAttribute("xlink:href");
      const op = el => (el?.getAttribute("opacity") ?? "1") * 1;
      return {
        d: document.querySelector(href)?.getAttribute("d"),
        opacity: op(text) * op(text.parentNode),
      };
    };
    viz.render(() => {
      setTimeout(() => {
        const before = label();
        const frames = [];
        let done = false;
        const sample = () => {
          const l = label();
          if (l) frames.push(l);
          if (!done) requestAnimationFrame(sample);
        };
        const values = config.data.map(d => ({
          ...d,
          value: d.id === "Manufacturing" ? d.value * 3 : d.value,
        }));
        viz.data(values).render(() => {
          frames.push(label());
          if (reducedMotion) {
            done = true;
            resolve({before, frames, after: label()});
          } else
            setTimeout(() => {
              done = true;
              resolve({before, frames, after: label()});
            }, 600);
        });
        sample();
      }, 700);
    });
  });

it("Donut: a redraw fades a label out and back in rather than sliding it", async () => {
  const out = await render('<div id="viz"></div>', redraw, [
    charts.Donut,
    false,
  ]);
  assert.ok(out.before && out.after, "the label draws before and after");
  assert.notStrictEqual(out.before.d, out.after.d, "it moves");
  const ds = new Set(out.frames.map(f => f.d));
  assert.deepStrictEqual(
    [...ds].filter(d => d !== out.before.d && d !== out.after.d),
    [],
    "never along a path between the two",
  );
  const swap = out.frames.findIndex(f => f.d === out.after.d);
  assert.ok(swap > 0, "it waits at its old place first");
  assert.ok(
    out.frames.slice(0, swap).some(f => f.opacity < 1),
    "fades out at its old place",
  );
  assert.ok(
    out.frames[swap].opacity < 0.2,
    `hidden when it moves: ${out.frames[swap].opacity}`,
  );
  const after = out.frames.slice(swap).map(f => f.opacity);
  assert.ok(
    after.every((o, k) => !k || o >= after[k - 1] - 1e-6),
    `then fades in: ${after}`,
  );
  assert.strictEqual(out.after.opacity, 1);
});

it("Donut: under reducedMotion a redraw puts the label in its new place at once", async () => {
  const out = await render('<div id="viz"></div>', redraw, [
    charts.Donut,
    true,
  ]);
  assert.notStrictEqual(out.before.d, out.after.d);
  assert.strictEqual(out.frames[out.frames.length - 1].d, out.after.d);
  assert.strictEqual(out.after.opacity, 1);
});
