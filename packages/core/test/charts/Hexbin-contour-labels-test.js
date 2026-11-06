import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Hexbin} from "../../index.ts";
import {
  CONTOUR_LABEL_MAX_LEVELS,
  contourLevelText,
  contourRings,
  emitContourLabels,
  hexbinRow,
  hexbinSettings,
  labelledLevels,
  paddedBand,
  ringDistance,
  ringLabelStretches,
} from "../../internal.ts";
import {PointGrid, resample} from "../../src/charts/Plot/lineLabelsAlong.ts";

useJsdom();

/** A closed circle of `n` points. */
const circle = (cx, cy, r, n = 120) => {
  const points = Array.from({length: n}, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  return [...points, points[0]];
};

const ringD = ring =>
  `M${ring
    .slice(0, -1)
    .map(([x, y]) => `${x},${y}`)
    .join("L")}Z`;

const walk = (node, out = []) => {
  out.push(node);
  if (node.type === "group") node.children.forEach(c => walk(c, out));
  return out;
};

it("contourRings: each ring closed, degenerate rings dropped", () => {
  const rings = contourRings("M0,0L10,0L10,10ZM20,20L30,20L30,30ZM5,5L6,6Z");
  assert.strictEqual(rings.length, 2);
  assert.deepStrictEqual(rings[0], [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 0],
  ]);
  assert.deepStrictEqual(rings[1][0], rings[1][rings[1].length - 1]);
  assert.deepStrictEqual(contourRings(""), []);
});

it("labelledLevels: all of a few, every other of many", () => {
  assert.deepStrictEqual(labelledLevels([1, 2, 3]), [true, true, true]);
  assert.strictEqual(CONTOUR_LABEL_MAX_LEVELS, 5);
  // Evenly spaced from the step: the even multiples of the step.
  assert.deepStrictEqual(labelledLevels([5, 10, 15, 20, 25, 30, 35]), [
    false,
    true,
    false,
    true,
    false,
    true,
    false,
  ]);
  assert.deepStrictEqual(labelledLevels([10, 20, 30, 40, 50, 60]), [
    false,
    true,
    false,
    true,
    false,
    true,
  ]);
  // Uneven levels: every other position.
  assert.deepStrictEqual(labelledLevels([1, 2, 4, 8, 16, 32]), [
    false,
    true,
    false,
    true,
    false,
    true,
  ]);
  assert.deepStrictEqual(labelledLevels([1, 2, 3, 4], 3), [
    false,
    true,
    false,
    true,
  ]);
});

it("ringDistance: the shorter way round", () => {
  assert.strictEqual(ringDistance(10, 90, 100), 20);
  assert.strictEqual(ringDistance(0, 50, 100), 50);
  assert.strictEqual(ringDistance(130, 20, 100), 10);
  assert.strictEqual(ringDistance(40, 40, 100), 0);
});

const stretchCtx = ring => {
  const grid = new PointGrid(10);
  grid.add(resample(ring, 2), 0);
  return {
    grid,
    rect: {x0: 0, y0: 0, x1: 600, y1: 600},
    fontSize: 10,
    lift: -3,
    ignore: 0,
    maxTurn: Math.PI / 3,
    clearance: 3,
  };
};

it("paddedBand: the label's band, half an em wider above and below", () => {
  const ctx = {fontSize: 10, lift: -3};
  const ys = [
    ...new Set(
      paddedBand(
        [
          [0, 100],
          [20, 100],
        ],
        ctx,
      ).map(p => Math.round(p[1] * 10) / 10),
    ),
  ].sort((a, b) => a - b);
  // Rows from 0.5em below the baseline to 0.5em above the letters.
  assert.strictEqual(ys[0], 100 - (-3 + 5 + 7));
  assert.strictEqual(ys[ys.length - 1], 100 - (-3 - 5));
  assert.strictEqual(ys.length, 9);
});

it("ringLabelStretches: spaced along a long ring, upright, on the line", () => {
  const ring = circle(300, 300, 200);
  const ctx = stretchCtx(ring);
  const stretches = ringLabelStretches(ring, 40, ctx, 300);
  // About 1250px round: up to four labels 300px apart.
  assert.ok(stretches.length >= 3 && stretches.length <= 4);
  const along = [];
  for (const s of stretches) {
    const [[x0, y0], [x1, y1]] = [s[0], s[s.length - 1]];
    const steep = Math.abs(x1 - x0) < Math.abs(y1 - y0) * 0.02;
    assert.ok(steep ? y0 > y1 : x0 < x1, "reads upright");
    for (const [x, y] of s)
      assert.ok(Math.abs(Math.hypot(x - 300, y - 300) - 200) < 1, "on it");
    const [mx, my] = [(x0 + x1) / 2, (y0 + y1) / 2];
    along.push(
      ((Math.atan2(my - 300, mx - 300) + 2 * Math.PI) % (2 * Math.PI)) * 200,
    );
  }
  for (let i = 0; i < along.length; i++)
    for (let j = i + 1; j < along.length; j++)
      assert.ok(
        ringDistance(along[i], along[j], 2 * Math.PI * 200) > 290,
        "well apart along the ring",
      );
  // Their bands are obstacles now, for the labels that follow.
  for (const s of stretches)
    assert.ok(ctx.grid.nearest(s[Math.floor(s.length / 2)], 0) < 5);
});

it("ringLabelStretches: none on a ring too small or too tight", () => {
  const small = circle(300, 300, 8);
  assert.deepStrictEqual(
    ringLabelStretches(small, 40, stretchCtx(small), 300),
    [],
  );
  // Long enough, but a 40px label turns more than 60° on it.
  const tight = circle(300, 300, 30);
  assert.deepStrictEqual(
    ringLabelStretches(tight, 40, stretchCtx(tight), 300),
    [],
  );
});

it("ringLabelStretches: at least one label, clear of other lines", () => {
  const ring = circle(300, 300, 100);
  const ctx = stretchCtx(ring);
  assert.strictEqual(ringLabelStretches(ring, 40, ctx, 2000).length, 1);
  // Another ring 5px inside crowds every stretch.
  const crowded = stretchCtx(ring);
  crowded.grid.add(resample(circle(300, 300, 95), 2), 1);
  assert.strictEqual(ringLabelStretches(ring, 40, crowded, 300).length, 0);
});

it("contourLevelText: levelFormat, or the abbreviated number", () => {
  const viz = new Hexbin();
  assert.strictEqual(contourLevelText(viz, 1500), "1.5k");
  assert.strictEqual(contourLevelText(viz, 5), "5");
  viz.levelFormat(d => `${d} pts`);
  assert.strictEqual(contourLevelText(viz, 5), "5 pts");
});

const frame = {left: 0, top: 0, width: 600, height: 600};
const contourRow = (index, level, ring) =>
  hexbinRow(`contour-${index}`, {
    kind: "contour",
    level,
    index,
    levels: 2,
    path: ringD(ring),
  });
const colorNode = (index, level, stroke) => ({
  type: "path",
  key: `contour-${index}`,
  d: "",
  datum: contourRow(index, level, circle(0, 0, 1)),
  paint: {stroke, strokeWidth: 1.5, fill: "#ccc"},
});

it("emitContourLabels: inert labels over pads that break the lines", () => {
  const viz = new Hexbin().binShape(false).contours(true);
  const rows = [
    contourRow(0, 5, circle(300, 300, 220)),
    contourRow(1, 10, circle(300, 300, 120)),
  ];
  const nodes = [colorNode(0, 5, "#0074D9"), colorNode(1, 10, "#FF4136")];
  const out = emitContourLabels(viz, rows, nodes, frame, hexbinSettings(viz));
  const pads = out.filter(n => n.type === "path");
  const texts = out.flatMap(n => walk(n)).filter(n => n.type === "text");
  assert.ok(pads.length >= 2, "a pad per label");
  assert.strictEqual(pads.length, texts.length);
  for (const pad of pads) {
    assert.strictEqual(pad.interactive, false);
    assert.strictEqual(
      pad.paint.stroke,
      "rgb(255, 255, 255)",
      "the chart's background",
    );
    assert.strictEqual(pad.paint.strokeWidth, 3.5, "wider than the line");
    assert.strictEqual(pad.paint.fill, "none");
  }
  assert.deepStrictEqual(
    [...new Set(texts.map(t => t.lines.map(l => l.text).join("")))].sort(),
    ["10", "5"],
  );
  for (const node of out) {
    assert.strictEqual(node.interactive, false);
    assert.strictEqual(node.datum, undefined);
    assert.strictEqual(node.aria.hidden, true);
  }
  assert.ok(
    texts.every(t => t.halo && t.paint.stroke === "rgb(255, 255, 255)"),
    "haloed in the background",
  );
  const lastPad = Math.max(...pads.map(p => out.indexOf(p)));
  const firstText = out.findIndex(n => n.type !== "path");
  assert.ok(lastPad < firstText, "pads beneath the text");
});

it("emitContourLabels: filled contours take no pads; labels can be turned off", () => {
  const rows = [contourRow(0, 5, circle(300, 300, 220))];
  const nodes = [colorNode(0, 5, "#0074D9")];
  const filled = new Hexbin().binShape(false).contours("filled");
  const out = emitContourLabels(
    filled,
    rows,
    nodes,
    frame,
    hexbinSettings(filled),
  );
  assert.ok(out.length > 0);
  assert.ok(
    out.every(n => n.type !== "path"),
    "no pads",
  );
  const off = new Hexbin().contours(true).contourConfig({labels: false});
  assert.deepStrictEqual(
    emitContourLabels(off, rows, nodes, frame, hexbinSettings(off)),
    [],
  );
});

it("emitContourLabels: keeps clear of other lines, and follows labelConfig", () => {
  const viz = new Hexbin()
    .binShape(false)
    .contours(true)
    .contourConfig({labelConfig: {fontSize: 14}});
  const ring = circle(300, 300, 220);
  const rows = [contourRow(0, 5, ring)];
  const nodes = [colorNode(0, 5, "#0074D9")];
  const texts = emitContourLabels(viz, rows, nodes, frame, hexbinSettings(viz))
    .flatMap(n => walk(n))
    .filter(n => n.type === "text");
  assert.ok(texts.length > 0);
  assert.ok(texts.every(t => t.font.size === 14));
  // A line 4px out all the way round crosses every label.
  const blocked = emitContourLabels(
    viz,
    rows,
    nodes,
    frame,
    hexbinSettings(viz),
    [circle(300, 300, 224)],
  );
  assert.deepStrictEqual(blocked, []);
});
