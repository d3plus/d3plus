import assert from "node:assert";
import {it} from "vitest";
import {
  addTooltipRows,
  hasTooltipRows,
  ownTbody,
  TOOLTIP_ROW_RANK,
} from "../../src/charts/features/tooltipRows.ts";

/** A stand-in tooltip whose `tbody` starts as `tbody`. */
const stubTooltip = tbody => ({
  _tbody: tbody,
  tbody(_) {
    if (!arguments.length) return this._tbody;
    this._tbody = _;
    return this;
  },
});

const own = [["own", "1"]];

it("addTooltipRows — leads or follows the tooltip's own rows, in rank order", () => {
  const tip = stubTooltip(own);
  addTooltipRows(tip, "threshold", d => [["member", d.id]], 3);
  addTooltipRows(tip, "confidence", d => [["bound", d.id]], 1);
  addTooltipRows(tip, "colorScale", d => [["value", d.id]], -1);
  assert.deepStrictEqual(tip.tbody()({id: "a"}, 0), [
    ["value", "a"],
    ["own", "1"],
    ["bound", "a"],
    ["member", "a"],
  ]);
});

it("addTooltipRows — wraps once; a key's rows replace its last ones", () => {
  const tip = stubTooltip((d, i) => [[`own ${d.id}`, `${i}`]]);
  addTooltipRows(tip, "confidence", () => [["bound", "1"]], 1);
  const wrapper = tip.tbody();
  addTooltipRows(tip, "outlier", () => [["Outlier"]], 2);
  addTooltipRows(tip, "confidence", () => [["bound", "2"]], 1);
  assert.strictEqual(tip.tbody(), wrapper, "the same wrapper");
  assert.deepStrictEqual(tip.tbody()({id: "b"}, 4), [
    ["own b", "4"],
    ["bound", "2"],
    ["Outlier"],
  ]);
});

it("addTooltipRows — rows resolve against each row the tooltip renders", () => {
  const tip = stubTooltip(undefined);
  addTooltipRows(tip, "threshold", d => (d.bucket ? [["member", "x"]] : []), 3);
  assert.deepStrictEqual(tip.tbody()({bucket: true}, 0), [["member", "x"]]);
  assert.deepStrictEqual(tip.tbody()({}, 0), []);
});

it("addTooltipRows — a new tbody starts a new wrapper", () => {
  const tip = stubTooltip(own);
  addTooltipRows(tip, "confidence", () => [["bound", "1"]], 1);
  tip.tbody([["reset", "0"]]);
  addTooltipRows(tip, "threshold", () => [["member", "m"]], 3);
  assert.deepStrictEqual(tip.tbody()({}, 0), [
    ["reset", "0"],
    ["member", "m"],
  ]);
});

it("ownTbody — the tbody without the added rows", () => {
  const fn = () => own;
  const tip = stubTooltip(fn);
  assert.strictEqual(ownTbody(tip.tbody()), fn, "nothing added");
  addTooltipRows(tip, "confidence", () => [["bound", "1"]], 1);
  assert.strictEqual(ownTbody(tip.tbody()), fn);
  const empty = stubTooltip(undefined);
  addTooltipRows(empty, "confidence", () => [], 1);
  assert.strictEqual(ownTbody(empty.tbody()), undefined);
  assert.deepStrictEqual(ownTbody(own), own);
});

it("hasTooltipRows — whether a key lists rows in the tooltip", () => {
  const tip = stubTooltip(own);
  assert.strictEqual(hasTooltipRows(tip, "threshold"), false);
  addTooltipRows(tip, "threshold", () => [], 3);
  assert.strictEqual(hasTooltipRows(tip, "threshold"), true);
  assert.strictEqual(hasTooltipRows(tip, "confidence"), false);
});

it("TOOLTIP_ROW_RANK — the colorScale leads; confidence, outlier, threshold follow", () => {
  const {colorScale, confidence, outlier, threshold} = TOOLTIP_ROW_RANK;
  assert.ok(colorScale < 0);
  assert.ok(0 < confidence && confidence < outlier && outlier < threshold);
});
