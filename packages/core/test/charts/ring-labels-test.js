import {it} from "vitest";
import assert from "assert";
import {pathTextBoxes, samplePath} from "@d3plus/render";
import {useJsdom} from "~test/jsdom.js";
import {
  chooseRingLabel,
  ringLabelEnd,
  ringLabelFit,
  ringLabelPair,
  ringLabelPosition,
  ringPoint,
  ringReadsClockwise,
  ringTextPath,
  textBroken,
} from "../../src/charts/features/ringLabels.ts";
import {
  RING_LABEL_FADE,
  clearRingLabels,
  ringLabelFont,
  ringLabelNodes,
  ringTextWidth,
} from "../../src/charts/features/ringLabelNodes.ts";

useJsdom();

const TAU = Math.PI * 2;
const near = (a, b, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
/** A text of `px` pixels per font-size pixel. */
const perPx = px => fs => px * fs;
/** Every point of a path's samples, as radius and angle. */
const polar = d =>
  samplePath(d).points.map(([x, y]) => ({
    r: Math.hypot(x, y),
    a: (Math.atan2(x, -y) + TAU) % TAU,
  }));

it("ringPoint — 12 o'clock is up, angles run clockwise", () => {
  const [x0, y0] = ringPoint(10, 0);
  near(x0, 0);
  near(y0, -10);
  const [x1, y1] = ringPoint(10, Math.PI / 2);
  near(x1, 10);
  near(y1, 0);
  const [x2, y2] = ringPoint(10, Math.PI);
  near(x2, 0);
  near(y2, 10);
});

it("ringReadsClockwise — clockwise on the top half, back the other way on the bottom", () => {
  assert.strictEqual(ringReadsClockwise(-0.3, 0.3), true, "12 o'clock");
  assert.strictEqual(ringReadsClockwise(1, 1.4), true, "upper right");
  assert.strictEqual(ringReadsClockwise(Math.PI - 0.2, Math.PI + 0.2), false);
  assert.strictEqual(ringReadsClockwise(4.8, 5.2), true, "upper left");
  // A wide arc reads by its middle.
  assert.strictEqual(ringReadsClockwise(-2, 2), true);
  assert.strictEqual(ringReadsClockwise(Math.PI - 2, Math.PI + 2), false);
});

it("ringTextPath — an arc of radius r between the angles, in reading order", () => {
  const cw = ringTextPath(100, -0.5, 0.5, true);
  assert.match(cw, /^M-47\.94,-87\.76A100,100 0 0 1 47\.94,-87\.76$/);
  const ccw = ringTextPath(100, Math.PI - 0.5, Math.PI + 0.5, false);
  assert.match(ccw, /A100,100 0 0 0 /);
  const pts = samplePath(ccw).points;
  assert.ok(pts[0][0] < pts[pts.length - 1][0], "left to right");
  for (const {r} of polar(cw)) near(r, 100, 0.5);
  assert.match(ringTextPath(50, 0, 4, true), / 0 1 1 /, "a large arc");
});

it("ringLabelFit — the largest size whose glyphs fit across the ring and the text along it", () => {
  const arc = {innerRadius: 100, outerRadius: 140, startAngle: 0, endAngle: 1};
  // 40px of ring holds 30px glyphs with 5px padding on either side.
  const short = ringLabelFit(arc, perPx(1), {fontMin: 8, fontMax: 50});
  assert.strictEqual(short.fontSize, 30);
  assert.strictEqual(ringLabelFit(arc, perPx(1)).fontSize, 24, "fontMax");
  // A longer text is held to the arc's length at its glyphs' inner edge,
  // less 0.3em at either end.
  const fit = ringLabelFit(arc, perPx(4), {fontMin: 8, fontMax: 50});
  assert.strictEqual(fit.fontSize, 24);
  assert.strictEqual(fit.clockwise, true);
  assert.strictEqual(fit.truncated, false);
  near(fit.radius, 120 - 0.3 * fit.fontSize);
  // The path is centered on the arc's middle and stays within it.
  const pts = polar(fit.d);
  near((pts[0].a + pts[pts.length - 1].a) / 2, 0.5, 0.01);
  assert.ok(pts.every(p => p.a >= 0 && p.a <= 1));
  near(fit.length, samplePath(fit.d).total, 1);
  // A narrower arc shrinks the text to fit along it.
  const narrow = ringLabelFit({...arc, endAngle: 0.4}, perPx(4));
  assert.strictEqual(narrow.fontSize, 9);
  assert.strictEqual(narrow.truncated, false);
  assert.ok(4 * narrow.fontSize <= narrow.length + 1e-6);
});

it("ringLabelFit — glyphs sit on the ring's middle, the baseline outside it on the bottom half", () => {
  const bottom = {
    innerRadius: 100,
    outerRadius: 140,
    startAngle: Math.PI - 0.5,
    endAngle: Math.PI + 0.5,
  };
  const fit = ringLabelFit(bottom, perPx(3), {fontMax: 20});
  assert.strictEqual(fit.clockwise, false);
  near(fit.radius, 120 + 0.3 * fit.fontSize);
  // Placed as a text node, its glyph boxes center on the middle radius.
  const boxes = pathTextBoxes({
    type: "text",
    key: "t",
    x: 0,
    y: 0,
    font: {size: fit.fontSize, anchor: "middle"},
    lines: [{text: "x", x: (fit.length - 60) / 2, y: 0, width: 60}],
    path: {d: fit.d},
  });
  for (const b of boxes) near(Math.hypot(b.x, b.y), 120, 0.5);
});

it("ringLabelFit — aligns to the outer or inner edge", () => {
  const arc = {innerRadius: 0, outerRadius: 200, startAngle: 0, endAngle: 1};
  const outer = ringLabelFit(arc, perPx(4), {fontMax: 12, align: "outer"});
  near(outer.radius, 200 - 5 - 6 - 0.3 * 12);
  const inner = ringLabelFit(
    {...arc, innerRadius: 200, outerRadius: 230},
    perPx(4),
    {fontMax: 12, align: "inner"},
  );
  near(inner.radius, 200 + 5 + 6 - 0.3 * 12);
});

it("ringLabelEnd — the padding at each end of the text, never under 0.3em", () => {
  assert.strictEqual(ringLabelEnd(5, 10), 5);
  assert.strictEqual(ringLabelEnd(5, 30), 9);
  assert.strictEqual(ringLabelEnd(0, 20), 6);
});

it("ringLabelFit — the glyphs keep their padding from the ring and 0.3em from the segment's ends", () => {
  for (const [startAngle, endAngle] of [
    [0.2, 1.4],
    [Math.PI - 0.6, Math.PI + 0.6],
  ]) {
    const arc = {innerRadius: 100, outerRadius: 150, startAngle, endAngle};
    const width = perPx(5);
    const fit = ringLabelFit(arc, width, {fontMax: 40});
    const fs = fit.fontSize;
    const boxes = pathTextBoxes({
      type: "text",
      key: "t",
      x: 0,
      y: 0,
      font: {size: fs, anchor: "middle"},
      lines: [{text: "x", x: fit.length / 2, y: 0, width: width(fs)}],
      path: {d: fit.d},
    });
    for (const b of boxes) {
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
        assert.ok(r >= 105 - 0.5 && r <= 145 + 0.5, `radius ${r}`);
        const a = (Math.atan2(x, -y) + TAU) % TAU;
        const edge = Math.min(a - startAngle, endAngle - a) * r;
        assert.ok(edge >= 0.3 * fs - 0.5, `${edge}px from an end at ${fs}px`);
      }
    }
  }
});

it("ringLabelFit — cuts a long text short, or gives up", () => {
  const arc = {
    innerRadius: 100,
    outerRadius: 130,
    startAngle: 0,
    endAngle: 0.4,
  };
  const cut = ringLabelFit(arc, perPx(20), {fontMin: 8});
  assert.strictEqual(cut.truncated, true);
  assert.strictEqual(cut.fontSize, 8);
  assert.strictEqual(
    ringLabelFit(arc, perPx(20), {fontMin: 8, truncate: false}),
    null,
  );
  // Too thin for the smallest font.
  assert.strictEqual(
    ringLabelFit({...arc, outerRadius: 108}, perPx(1), {fontMin: 8}),
    null,
  );
  // Too short to hold a few letters.
  assert.strictEqual(
    ringLabelFit({...arc, endAngle: 0.15}, perPx(20), {fontMin: 8}),
    null,
  );
  // A whole disc has no ring to follow.
  assert.strictEqual(
    ringLabelFit(
      {innerRadius: 0, outerRadius: 100, startAngle: 0, endAngle: TAU},
      perPx(1),
    ),
    null,
  );
  // Too close to the center: the letters would fan out.
  assert.strictEqual(
    ringLabelFit(
      {innerRadius: 2, outerRadius: 22, startAngle: 0, endAngle: 3},
      perPx(1),
      {fontMin: 8},
    ),
    null,
  );
});

it("ringLabelFit — keeps clear of the pad between segments", () => {
  const arc = {
    innerRadius: 100,
    outerRadius: 130,
    startAngle: 0,
    endAngle: 0.5,
  };
  const open = ringLabelFit(arc, perPx(4), {fontMax: 12});
  const padded = ringLabelFit({...arc, padAngle: 0.1}, perPx(4), {
    fontMax: 12,
  });
  assert.ok(padded.length < open.length - 10);
});

it("ringLabelPair — a smaller second line beneath the first", () => {
  const arc = {innerRadius: 100, outerRadius: 180, startAngle: 0, endAngle: 1};
  const [name, share] = ringLabelPair(arc, perPx(4), perPx(2), {fontMax: 24});
  assert.ok(share.fontSize < name.fontSize);
  assert.ok(share.fontSize >= 8);
  // Beneath is toward the center on the top half…
  assert.ok(share.radius < name.radius);
  // …and away from it on the bottom half.
  const [n2, s2] = ringLabelPair(
    {...arc, startAngle: Math.PI - 0.5, endAngle: Math.PI + 0.5},
    perPx(4),
    perPx(2),
    {fontMax: 24},
  );
  assert.ok(s2.radius > n2.radius);
  // A thin ring holds one line only.
  assert.strictEqual(
    ringLabelPair({...arc, outerRadius: 115}, perPx(4), perPx(2)),
    null,
  );
});

it("chooseRingLabel — per labelPosition, and the larger whole label on auto", () => {
  const big = {fontSize: 20, truncated: false};
  const small = {fontSize: 12, truncated: false};
  const cut = {fontSize: 8, truncated: true};
  assert.strictEqual(chooseRingLabel("inside", small, big), "straight");
  assert.strictEqual(chooseRingLabel("outside", null, big), null);
  assert.strictEqual(chooseRingLabel("along", big, cut), "curved");
  assert.strictEqual(chooseRingLabel("along", big, null), null);
  assert.strictEqual(chooseRingLabel("auto", small, big), "curved");
  assert.strictEqual(chooseRingLabel("auto", big, small), "straight");
  assert.strictEqual(chooseRingLabel("auto", null, small), "curved");
  assert.strictEqual(chooseRingLabel("auto", cut, small), "curved");
  assert.strictEqual(chooseRingLabel("auto", small, cut), "straight");
  assert.strictEqual(chooseRingLabel("auto", null, cut), "curved");
  assert.strictEqual(chooseRingLabel("auto", null, null), null);
  assert.strictEqual(chooseRingLabel("auto", big, big), "straight");
  assert.strictEqual(chooseRingLabel("auto", big, big, "curved"), "curved");
  assert.strictEqual(chooseRingLabel(undefined, small, big), "curved");
});

it("ringLabelPosition — a constant or a row accessor", () => {
  const row = {id: "a"};
  assert.strictEqual(
    ringLabelPosition({schema: {labelPosition: "along"}}, row, 0),
    "along",
  );
  assert.strictEqual(
    ringLabelPosition(
      {
        schema: {
          labelPosition: (d, i) =>
            d.id === "a" && i === 3 ? "inside" : "auto",
        },
      },
      row,
      3,
    ),
    "inside",
  );
});

it("textBroken — an ellipsis or a word split across lines", () => {
  assert.strictEqual(textBroken(["Health", "Care"], "Health Care"), false);
  assert.strictEqual(textBroken(["Agri-", "culture"], "Agriculture"), true);
  assert.strictEqual(textBroken(["Manufac..."], "Manufacturing"), true);
  assert.strictEqual(textBroken([], "Mining"), true);
});

it("ringLabelFont — plain font values only", () => {
  assert.deepStrictEqual(
    ringLabelFont({fontFamily: "Inter", fontWeight: 600, fontSize: 9}),
    {fontFamily: "Inter", fontWeight: 600},
  );
  assert.deepStrictEqual(ringLabelFont({fontFamily: () => "x"}), {});
});

it("ringTextWidth — scales with the font size", () => {
  const width = ringTextWidth("Manufacturing", {});
  assert.ok(width(10) > 40);
  near(width(20), width(10) * 2, 1e-6);
});

const viz = (dark = false) => ({
  schema: {locale: "en-US"},
  _theme: {dark},
});

it("ringLabelNodes — inert text on each arc, in its own size and color, with its segment's datum", () => {
  const row = {id: "a"};
  const fit = ringLabelFit(
    {innerRadius: 100, outerRadius: 140, startAngle: 0, endAngle: 1.2},
    ringTextWidth("Alpha", {}),
  );
  const [node] = ringLabelNodes(viz(), [
    {key: "k", text: "Alpha", fit, color: "#123456", datum: row, index: 2},
  ]);
  assert.strictEqual(node.lines[0].text, "Alpha");
  assert.strictEqual(node.font.size, fit.fontSize);
  assert.strictEqual(node.font.anchor, "middle");
  assert.strictEqual(node.paint.fill, "#123456");
  assert.strictEqual(node.path.d, fit.d);
  assert.strictEqual(node.datum, row);
  assert.strictEqual(node.index, 2);
  assert.strictEqual(node.interactive, false);
  assert.strictEqual(node.aria.hidden, true);
  assert.strictEqual(node.halo, undefined);
  assert.deepStrictEqual(node.fadeSwap, RING_LABEL_FADE);
});

it("ringLabelNodes — cuts long text short and drops what keeps no letters", () => {
  const nodes = ringLabelNodes(viz(), [
    {
      key: "long",
      text: "A name far longer than its arc",
      fit: {d: ringTextPath(100, 0, 0.5, true), fontSize: 10},
      color: "#000",
    },
    {
      key: "none",
      text: "Nothing fits",
      fit: {d: ringTextPath(100, 0, 0.02, true), fontSize: 10},
      color: "#000",
    },
  ]);
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    ["long"],
  );
  assert.ok(nodes[0].lines[0].text.endsWith("..."));
  assert.deepStrictEqual(ringLabelNodes(viz(), []), []);
});

it("clearRingLabels — drops a label that covers an obstacle or an earlier label", () => {
  const label = (key, a0, a1) => ({
    key,
    text: "Label text",
    fit: {d: ringTextPath(100, a0, a1, true), fontSize: 12},
    color: "#000",
  });
  const [a, b, c] = ringLabelNodes(viz(), [
    label("a", 0, 0.8),
    label("b", 0.2, 1),
    label("c", 1.5, 2.3),
  ]);
  assert.deepStrictEqual(
    clearRingLabels([a, b, c]).map(n => n.key),
    ["a", "c"],
  );
  const wall = {
    x: ringPoint(100, 1.9)[0],
    y: ringPoint(100, 1.9)[1],
    width: 20,
    height: 20,
    angle: 0,
  };
  assert.deepStrictEqual(
    clearRingLabels([a, c], [wall]).map(n => n.key),
    ["a"],
  );
});
