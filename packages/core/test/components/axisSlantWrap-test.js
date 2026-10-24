import {it} from "vitest";
import assert from "assert";
import {
  SLANTED_MAX_LINES,
  narrowestWidth,
  slantedLineWidth,
  slantedLines,
} from "../../src/components/Axis/axisSlantWrap.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/** #438: slanted axis labels wrap onto up to three lines. */

it("slantedLines — the lines a slanted label's thickness holds, 1 to 3", () => {
  assert.strictEqual(slantedLines(10, 17), 1, "at least one");
  assert.strictEqual(slantedLines(34, 17), 2);
  assert.strictEqual(slantedLines(50, 17), 2);
  assert.strictEqual(slantedLines(51, 17), 3);
  assert.strictEqual(slantedLines(500, 17), SLANTED_MAX_LINES);
});

it("narrowestWidth — the narrowest width that wraps onto the lines allowed", () => {
  // A text 300 wide wraps onto ceil(300 / width) lines.
  const count = width => Math.ceil(300 / width);
  assert.strictEqual(narrowestWidth(count, 2, 150, 1000), 150);
  const three = narrowestWidth(count, 3, 50, 1000);
  assert.ok(count(three) <= 3 && three >= 100 && three < 110, `${three}`);
  assert.strictEqual(narrowestWidth(count, 1, 50, 200), 200, "capped at max");
});

it("slantedLineWidth — one width for every label, set by the longest", () => {
  const font = {fontFamily: "sans-serif", fontSize: 12, lineHeight: 17};
  const long = {...font, text: "Agriculture, Forestry and Fishing"};
  const short = {...font, text: "Mining"};
  const single = slantedLineWidth([long, short], 1, 400);
  assert.strictEqual(single, 400, "one line: no narrower than allowed");
  const two = slantedLineWidth([long, short], 2, 400);
  const three = slantedLineWidth([long, short], 3, 400);
  assert.ok(two < 400 && three < two, `${three} < ${two} < 400`);
  assert.strictEqual(
    slantedLineWidth([long, short], 2, 400),
    slantedLineWidth([long], 2, 400),
    "the longest label sets it",
  );
  const word = slantedLineWidth(
    [{...font, text: "Telecommunications"}],
    3,
    400,
  );
  assert.ok(word > 60, `never narrower than a word: ${word}`);
});
