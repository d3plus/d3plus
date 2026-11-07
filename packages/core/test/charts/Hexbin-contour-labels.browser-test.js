import {it} from "vitest";
import {pathTextBoxes, samplePath} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    Hexbin's contour labels in a real browser, on both renderers: each
    labelled level's value sits centered on its contour line, reads upright,
    breaks the line on a pad of the background, and keeps clear of the other
    labels; the labels follow the theme, are no focus target, pass the
    pointer through to the marks beneath, and redraw without motion under
    `reducedMotion`.
*/

const box = "<div id='viz' style='width:720px;height:460px'></div>";

// 2,000 correlated observations from a seeded generator.
let seed = 11;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const normal = () =>
  Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
const people = Array.from({length: 2000}, () => {
  const a = normal();
  const b = normal();
  return {x: 170 + 9 * a, y: 72 + 11 * (0.7 * a + 0.71 * b)};
});

/** Draws a Hexbin and reads its contours, labels, and pads. */
const draw = async ({renderer, config, perBin}) => {
  const d3plus = window.d3plus;
  const chart = new d3plus.Hexbin()
    .data(people)
    .x("x")
    .y("y")
    .binShape(false)
    .contours(true)
    .renderer(renderer)
    .duration(0)
    .config(config ?? {})
    .select("#viz");
  if (perBin) chart.levelFormat(d => `${d} per bin`);
  await new Promise(resolve => chart.render(resolve));
  const contours = {};
  const labels = [];
  const pads = [];
  const walk = (n, ox, oy) => {
    const x = ox + (n.transform?.x ?? 0),
      y = oy + (n.transform?.y ?? 0);
    const key = String(n.key);
    const meta = n.datum && d3plus.hexbinMeta(n.datum);
    const shift = ([px, py]) => [px + x, py + y];
    if (n.type === "path" && meta?.kind === "contour")
      contours[meta.index] = {
        level: meta.level,
        rings: (n.d.match(/M[^M]*/g) || []).map(d =>
          samplePath(d).points.map(shift),
        ),
      };
    if (n.type === "path" && key.endsWith("-pad"))
      pads.push({key, stroke: n.paint.stroke, interactive: n.interactive});
    if (n.type === "text" && key.includes("contour-label-"))
      labels.push({
        key,
        level: Number(key.match(/contour-label-(\d+)-/)[1]),
        text: n.lines[0].text,
        fill: n.paint.fill,
        halo: n.paint.stroke,
        interactive: n.interactive,
        path: samplePath(n.path.d).points.map(shift),
        boxes: pathTextBoxes(n).map(b => ({...b, x: b.x + x, y: b.y + y})),
      });
    (n.children || []).forEach(c => walk(c, x, y));
  };
  walk(chart._paintedScene.root, 0, 0);
  const targets = d3plus.focusTargets(chart._paintedScene.root.children);
  return {
    contours,
    labels,
    pads,
    background: d3plus.chartBackground(chart),
    labelTargets: targets.filter(t =>
      String(t.node.key).includes("contour-label"),
    ).length,
    textPaths: document.querySelectorAll("#viz textPath").length,
  };
};

/** The distance from a point to a polyline. */
const distance = ([px, py], points) => {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const dx = bx - ax,
      dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2
      ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
      : 0;
    best = Math.min(best, Math.hypot(ax + dx * t - px, ay + dy * t - py));
  }
  return best;
};

/** Whether two turned boxes overlap (separating axis test). */
const overlap = (a, b) => {
  const corners = r => {
    const rad = (r.angle * Math.PI) / 180;
    const c = Math.cos(rad),
      s = Math.sin(rad);
    return [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([u, v]) => [
      r.x + (u * r.width * c) / 2 - (v * r.height * s) / 2,
      r.y + (u * r.width * s) / 2 + (v * r.height * c) / 2,
    ]);
  };
  const ca = corners(a),
    cb = corners(b);
  for (const poly of [ca, cb])
    for (let i = 0; i < 4; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % 4];
      const axis = [y2 - y1, x1 - x2];
      const proj = pts => pts.map(([x, y]) => x * axis[0] + y * axis[1]);
      const pa = proj(ca),
        pb = proj(cb);
      if (
        Math.max(...pa) < Math.min(...pb) ||
        Math.max(...pb) < Math.min(...pa)
      )
        return false;
    }
  return true;
};

/** A color's relative luminance, from the page's computed style. */
const luminance = color => {
  const el = document.createElement("div");
  el.style.color = color;
  document.body.appendChild(el);
  const [r, g, b] = getComputedStyle(el)
    .color.match(/\d+(\.\d+)?/g)
    .map(Number);
  el.remove();
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] labels sit on their contour lines, upright, clear of each other`, async () => {
    const out = await render(box, draw, {renderer});
    const levels = Object.values(out.contours);
    assert.ok(levels.length > 5, `${levels.length} levels`);
    assert.ok(out.labels.length >= 3, `${out.labels.length} labels`);
    // More than five levels: every other one is labelled.
    const labelled = new Set(out.labels.map(l => l.level));
    assert.ok(labelled.size <= Math.ceil(levels.length / 2));
    assert.ok(labelled.size >= 2);
    for (const label of out.labels) {
      const contour = out.contours[label.level];
      assert.strictEqual(label.text, `${contour.level}`, "the level's value");
      assert.strictEqual(label.interactive, false);
      assert.ok(label.boxes.length > 0);
      for (const b of label.boxes) {
        const d = Math.min(...contour.rings.map(r => distance([b.x, b.y], r)));
        assert.ok(d < 2.5, `${label.key}'s glyphs sit on its line (${d})`);
      }
      const [x0, y0] = label.path[0];
      const [x1, y1] = label.path[label.path.length - 1];
      const steep = Math.abs(x1 - x0) < Math.abs(y1 - y0) * 0.02;
      assert.ok(steep ? y0 > y1 : x0 < x1, `${label.key} reads upright`);
    }
    for (let i = 0; i < out.labels.length; i++)
      for (let j = i + 1; j < out.labels.length; j++)
        for (const a of out.labels[i].boxes)
          for (const b of out.labels[j].boxes)
            assert.ok(
              !overlap(a, b),
              `${out.labels[i].key} and ${out.labels[j].key} overlap`,
            );
    assert.strictEqual(out.pads.length, out.labels.length, "a pad each");
    assert.ok(out.pads.every(p => p.interactive === false));
    assert.ok(out.pads.every(p => p.stroke === out.background));
    assert.strictEqual(out.labelTargets, 0, "no label is a focus target");
    if (renderer === "svg")
      assert.strictEqual(out.textPaths, out.labels.length);
  });

  it(`[${renderer}] labels follow the theme`, async () => {
    const light = await render(box, draw, {renderer});
    const dark = await render(box, draw, {renderer, config: {theme: "dark"}});
    const over = await render(box, draw, {
      renderer,
      config: {theme: "dark", binShape: "hex"},
    });
    assert.ok(dark.labels.length > 0 && over.labels.length > 0);
    for (const [out, name] of [
      [dark, "dark"],
      [over, "dark over bins"],
    ]) {
      assert.ok(luminance(out.background) < 0.25, name);
      assert.ok(
        out.pads.every(p => p.stroke === out.background),
        `${name} pads take the background`,
      );
      assert.ok(
        out.labels.every(l => l.halo === out.background),
        `${name} halos take the background`,
      );
      assert.ok(
        out.labels.every(l => luminance(l.fill) > 0.45),
        `${name} labels are light (${out.labels.map(l => l.fill)})`,
      );
    }
    assert.ok(luminance(light.background) > 0.9);
    assert.ok(
      light.labels.every(l => luminance(l.fill) < 0.5),
      `light labels are dark (${light.labels.map(l => l.fill)})`,
    );
  });

  it(`[${renderer}] levelFormat formats the labels; filled contours take no pads; labels turn off`, async () => {
    const formatted = await render(box, draw, {
      renderer,
      perBin: true,
    });
    assert.ok(formatted.labels.length > 0);
    for (const label of formatted.labels)
      assert.strictEqual(
        label.text,
        `${formatted.contours[label.level].level} per bin`,
      );
    const filled = await render(box, draw, {
      renderer,
      config: {contours: "filled"},
    });
    assert.ok(filled.labels.length > 0);
    assert.strictEqual(filled.pads.length, 0);
    const off = await render(box, draw, {
      renderer,
      config: {contourConfig: {labels: false}},
    });
    assert.ok(Object.keys(off.contours).length > 0);
    assert.strictEqual(off.labels.length, 0);
    assert.strictEqual(off.pads.length, 0);
  });

  it(`[${renderer}] labelStep and labelSpacing choose the labelled levels and how often they repeat`, async () => {
    const auto = await render(box, draw, {renderer});
    const all = await render(box, draw, {
      renderer,
      config: {contourConfig: {labelStep: 1}},
    });
    const levels = out => new Set(out.labels.map(l => l.level));
    const count = Object.keys(auto.contours).length;
    assert.ok(count > 5, `${count} levels`);
    assert.ok(
      levels(all).size > levels(auto).size,
      `${levels(all).size} vs ${levels(auto).size} levels labelled`,
    );
    // Every third level: the multiples of three spacings.
    const third = await render(box, draw, {
      renderer,
      config: {contourConfig: {labelStep: 3}},
    });
    const spacing = auto.contours[1].level - auto.contours[0].level;
    assert.ok(levels(third).size > 0);
    for (const level of levels(third)) {
      const value = third.contours[level].level;
      assert.strictEqual(Math.round(value / spacing) % 3, 0, `${value}`);
    }
    // Labels along one ring: closer with a short spacing, one with a long one.
    const perRing = out => {
      const byRing = {};
      for (const l of out.labels) {
        const ring = l.key.replace(/-\d+$/, "");
        byRing[ring] = (byRing[ring] || 0) + 1;
      }
      return Math.max(...Object.values(byRing));
    };
    const close = await render(box, draw, {
      renderer,
      config: {contourConfig: {labelStep: 1, labelSpacing: 120}},
    });
    const far = await render(box, draw, {
      renderer,
      config: {contourConfig: {labelStep: 1, labelSpacing: 5000}},
    });
    assert.ok(
      perRing(close) > perRing(all),
      `${perRing(close)} vs ${perRing(all)} labels on a ring`,
    );
    assert.strictEqual(perRing(far), 1);
    for (const out of [all, third, close, far])
      for (let i = 0; i < out.labels.length; i++)
        for (let j = i + 1; j < out.labels.length; j++)
          for (const a of out.labels[i].boxes)
            for (const b of out.labels[j].boxes)
              assert.ok(!overlap(a, b), "labels never overlap");
  });

  it(`[${renderer}] under reducedMotion, a redraw places the labels without motion`, async () => {
    const out = await render(
      box,
      ([renderer, data]) =>
        new Promise(resolve => {
          const chart = new window.d3plus.Hexbin()
            .data(data)
            .x("x")
            .y("y")
            .binShape(false)
            .contours(true)
            .reducedMotion(true)
            .renderer(renderer)
            .select("#viz");
          chart.render(() => {
            const durations = [];
            const drawScene = chart._sceneRenderer.drawScene.bind(
              chart._sceneRenderer,
            );
            chart._sceneRenderer.drawScene = (scene, opts) => {
              durations.push(opts?.duration ?? 0);
              return drawScene(scene, opts);
            };
            chart.contourConfig({thresholds: 4}).render(() => {
              let labels = 0;
              const visit = n => {
                if (
                  n.type === "text" &&
                  String(n.key).includes("contour-label-")
                )
                  labels++;
                (n.children || []).forEach(visit);
              };
              visit(chart._paintedScene.root);
              resolve({
                durations,
                labels,
                textPaths: document.querySelectorAll("#viz textPath").length,
              });
            });
          });
        }),
      [renderer, people],
    );
    assert.ok(out.durations.length > 0, "the redraw painted");
    assert.deepStrictEqual(
      out.durations.filter(d => d > 0),
      [],
    );
    assert.ok(out.labels > 0);
    if (renderer === "svg") assert.strictEqual(out.textPaths, out.labels);
  });

  it(`[${renderer}] a label passes the pointer through to the bin beneath`, async () => {
    await withPage(box, async page => {
      const point = await page.evaluate(
        ([renderer, data]) =>
          new Promise(resolve => {
            const chart = new window.d3plus.Hexbin()
              .data(data)
              .x("x")
              .y("y")
              .contours(true)
              .renderer(renderer)
              .duration(0)
              .select("#viz");
            chart.render(() => {
              let label = null;
              const walk = (n, x, y) => {
                const t = n.transform || {};
                const nx = x + (t.x || 0),
                  ny = y + (t.y || 0);
                if (
                  !label &&
                  n.type === "text" &&
                  String(n.key).includes("contour-label-")
                ) {
                  const pts = n.path.d.match(/-?[\d.]+,-?[\d.]+/g);
                  const [px, py] = pts[Math.floor(pts.length / 2)]
                    .split(",")
                    .map(Number);
                  label = [nx + px, ny + py];
                }
                (n.children || []).forEach(c => walk(c, nx, ny));
              };
              walk(chart._paintedScene.root, 0, 0);
              const host =
                document.querySelector("#viz svg") ||
                document.querySelector("#viz canvas");
              const rect = host.getBoundingClientRect();
              resolve(label && [rect.left + label[0], rect.top + label[1]]);
            });
          }),
        [renderer, people],
      );
      assert.ok(point, "a label is drawn");
      await page.mouse.move(point[0] - 3, point[1] - 3);
      await page.mouse.move(...point, {steps: 3});
      await page.waitForTimeout(150);
      const tips = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".d3plus-tooltip"))
          .filter(el => getComputedStyle(el).opacity !== "0")
          .map(el => el.textContent),
      );
      assert.ok(
        tips.some(t => t.includes("Count")),
        `the bin beneath takes the hover (got ${JSON.stringify(tips)})`,
      );
    });
  });
}
