import {it} from "vitest";
import assert from "assert";
import {textWrap} from "@d3plus/text";
import {axisLabelEllipsis} from "../../src/components/Axis/axisDefaults.ts";
import {
  cutLabel,
  longWordLabel,
} from "../../src/components/Axis/axisLabelSize.ts";
import {
  fitOwnSpaces,
  roomAround,
} from "../../src/components/Axis/axisLabelThinning.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/** Axis labels with no break in them, cut short to fit their room. */

const wrap = () => textWrap().fontFamily("sans-serif").fontSize(12);
const word = "A".repeat(30);
const shown = res => res.lines.filter(l => l !== "");

it("axisLabelEllipsis — ends a cut label with three dots", () => {
  assert.strictEqual(axisLabelEllipsis("AAAA"), "AAAA...");
  assert.strictEqual(axisLabelEllipsis(""), "", "nothing left to end");
});

it("cutLabel — cuts a word too wide for its room to one line ending in dots", () => {
  const res = cutLabel(wrap(), word, 60);
  assert.strictEqual(shown(res).length, 1, JSON.stringify(res.lines));
  assert.match(res.lines[0], /^A+\.\.\.$/);
  assert.ok(res.widths[0] <= 60, `${res.widths[0]} <= 60`);
  const wider = cutLabel(wrap(), word, 120);
  assert.ok(
    wider.lines[0].length > res.lines[0].length,
    "more room keeps more of the word",
  );
});

it("cutLabel — no room for even one letter and the dots leaves no lines", () => {
  assert.deepStrictEqual(shown(cutLabel(wrap(), word, 5)), []);
});

it("longWordLabel — a word that fits across the axis is measured whole there", () => {
  const {res, cut} = longWordLabel(wrap(), word, 40, 1000, {});
  assert.strictEqual(cut, false);
  assert.deepStrictEqual(shown(res), [word]);
});

it("longWordLabel — a word too wide even across the axis is cut short within its share", () => {
  const {res, cut} = longWordLabel(wrap(), word, 60, 100, {});
  assert.strictEqual(cut, true);
  assert.strictEqual(shown(res).length, 1);
  assert.match(res.lines[0], /\.\.\.$/);
  assert.ok(res.widths[0] <= 60);
});

it("longWordLabel — labels in their own shares are cut only when asked to keep them", () => {
  // Across the axis is too narrow, but own-share labels are left whole or
  // hidden (see fitOwnSpaces) until none fits.
  const own = longWordLabel(wrap(), word, 60, 100, {ownSpace: true});
  assert.strictEqual(own.cut, false);
  assert.deepStrictEqual(shown(own.res), []);
  const kept = longWordLabel(wrap(), word, 60, 1000, {
    ownSpace: true,
    keepShare: true,
  });
  assert.strictEqual(
    kept.cut,
    true,
    "kept to its share, even with room across",
  );
  assert.ok(kept.res.widths[0] <= 60);
});

it("longWordLabel — a share too narrow for anything is not cut", () => {
  const {res, cut} = longWordLabel(wrap(), word, 5, 5, {keepShare: true});
  assert.strictEqual(cut, false);
  assert.deepStrictEqual(shown(res), []);
});

it("roomAround — twice the distance to the nearer end", () => {
  assert.strictEqual(roomAround(50, [0, 200]), 100);
  assert.strictEqual(roomAround(150, [0, 200]), 100);
  assert.strictEqual(roomAround(100, [200, 0]), 200, "either way round");
  assert.strictEqual(roomAround(-5, [0, 200]), 0, "a tick off the axis");
  assert.strictEqual(roomAround(205, [0, 200]), 0);
});

it("fitOwnSpaces — a lone label near an end of the axis stays within it", () => {
  // Centered 20px from the start, it can't be wider than 40px.
  const textData = [
    {i: 0, position: 20, fP: 5, width: 300, space: 20, fits: false, lines: []},
  ];
  const widths = [];
  fitOwnSpaces(textData, [30], [0, 200], (d, space) => {
    widths.push(space);
    return Object.assign(d, {fits: space >= 300, lines: []});
  });
  // Then, with no label left, in its own 20px share (30 less its padding),
  // which leaves it no lines either.
  assert.strictEqual(Math.max(...widths), 40, `${widths}`);
  assert.strictEqual(widths[widths.length - 1], 20, `${widths}`);
  assert.strictEqual(textData[0].truncated, true, "too wide for that: hidden");
});

it("fitOwnSpaces — when no label fits whole, each is cut short in its own share", () => {
  const textData = [50, 150].map((position, i) => ({
    i,
    position,
    fP: 5,
    width: 300,
    space: 90,
    fits: false,
    lines: [],
  }));
  const calls = [];
  fitOwnSpaces(textData, [100, 100], [0, 200], (d, space, keepShare) => {
    calls.push([d.i, space, !!keepShare]);
    // Cut short when kept to its share, else still too wide to draw.
    return Object.assign(d, {
      lines: keepShare ? ["AAA..."] : [],
      fits: false,
    });
  });
  const cuts = calls.filter(c => c[2]);
  assert.deepStrictEqual(
    cuts,
    [
      [0, 90, true],
      [1, 90, true],
    ],
    "each within its 100px share, less its padding",
  );
  assert.deepStrictEqual(
    textData.map(d => d.truncated),
    [false, false],
    "both drawn",
  );
});

it("fitOwnSpaces — a label whose tick lies off the axis stays hidden", () => {
  const textData = [-20, 100].map((position, i) => ({
    i,
    position,
    fP: 5,
    width: 300,
    space: 90,
    fits: false,
    lines: [],
  }));
  fitOwnSpaces(
    textData,
    [120, 120],
    [0, 200],
    (d, space, keepShare) =>
      Object.assign(d, {lines: keepShare ? ["A..."] : [], fits: false}),
    [0, 200],
  );
  assert.deepStrictEqual(
    textData.map(d => d.truncated),
    [true, false],
  );
});
