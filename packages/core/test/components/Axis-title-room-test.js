import {it} from "vitest";
import assert from "assert";
import {AxisBottom, AxisLeft, AxisRight, AxisTop} from "../../index.ts";
import {measureAxis} from "../../src/components/Axis/axisLimit.ts";
import {titleRoom} from "../../src/components/Axis/axisTitle.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    An axis title claims exactly the room it is drawn in: the title is
    measured as its TextBox draws it (font, line height, and the full width
    of the axis range), so the margin it claims holds its painted lines and
    no more.
*/

const short = "Year";
const long =
  "A very long axis title that has to wrap onto more than one line here";

const axis = (Type, title, config = {}) =>
  new Type()
    .renderMode("compute")
    .select(null)
    .width(300)
    .height(300)
    .domain([0, 100])
    .title(title)
    .config(config)
    .render();

/** The axis's painted title, with the room the measure claimed for it. */
function title(a) {
  const [t] = a._titleClass._textData();
  const {hBuff} = measureAxis(a);
  const room = a._margin[a.schema.orient] - hBuff - a.schema.padding;
  return {t, room};
}

it("an axis title claims the height of the lines it paints", () => {
  for (const Type of [AxisBottom, AxisTop, AxisLeft, AxisRight])
    for (const text of [short, long]) {
      const a = axis(Type, text);
      const {t, room} = title(a);
      const name = `${a.schema.orient} "${text}"`;
      assert.ok(t, `${name}: paints the title`);
      assert.strictEqual(t.lH, 12 * 1.2, `${name}: TextBox's line height`);
      assert.strictEqual(
        room,
        Math.ceil(t.lines.length * t.lH),
        `${name}: claims its ${t.lines.length} painted lines`,
      );
    }
  const {t} = title(axis(AxisBottom, long));
  assert.ok(t.lines.length > 1, "the long title wraps");
});

it("an axis title is measured with its titleConfig", () => {
  for (const config of [
    {titleConfig: {fontSize: 20}},
    {titleConfig: {lineHeight: 30}},
    {titleConfig: {fontFamily: "monospace", fontWeight: 700}},
  ]) {
    const a = axis(AxisBottom, long, config);
    const {t, room} = title(a);
    assert.strictEqual(
      room,
      Math.ceil(t.lines.length * t.lH),
      JSON.stringify(config),
    );
  }
});

it("a title word too wide for its axis is cut short with an ellipsis", () => {
  // No break points: hyphenation skips a word with capitals inside it.
  const word = "GrossDomesticProductPerCapitaInConstantInternationalDollars";
  for (const Type of [AxisBottom, AxisTop, AxisLeft, AxisRight]) {
    const a = axis(Type, word);
    const {t, room} = title(a);
    const name = `${a.schema.orient}`;
    assert.ok(t, `${name}: paints the title`);
    assert.strictEqual(t.lines.length, 1, `${name}: on one line`);
    const [line] = t.lines;
    assert.ok(line.endsWith("..."), `${name}: "${line}" is cut short`);
    assert.ok(word.startsWith(line.slice(0, -3)), `${name}: "${line}"`);
    assert.ok(line.length > 3, `${name}: keeps the start of the word`);
    assert.ok(t.widths[0] <= t.w, `${name}: fits the axis`);
    assert.strictEqual(room, Math.ceil(t.lH), `${name}: claims its line`);
  }
});

const words = Array(12)
  .fill("the quick brown fox jumps over the lazy dog")
  .join(" ");
// Breaks only where its words hyphenate.
const url = `https://example.com/${Array(4)
  .fill("a/very/long/path/to/some/resource/and/more/segments")
  .join("/")}`;

it("a title cut short for height ends at a word break", () => {
  for (const [Type, size] of [
    [AxisBottom, {height: 70}],
    [AxisLeft, {width: 70}],
  ])
    for (const text of [words, url]) {
      const a = axis(Type, text, size);
      const {t, room} = title(a);
      const name = `${a.schema.orient} "${text.slice(0, 20)}"`;
      assert.ok(t.lines.length > 1, `${name}: wraps`);
      assert.ok(t.truncated, `${name}: is cut short`);
      const last = t.lines[t.lines.length - 1];
      assert.ok(last.endsWith("..."), `${name}: "${last}" ends in "..."`);
      assert.strictEqual(room, Math.ceil(t.lines.length * t.lH), name);
      // Cut where whole words stop, as without `truncateWord`.
      const [whole] = a._titleClass.truncateWord(false)._textData();
      assert.deepStrictEqual(t.lines, whole.lines, `${name}: at a word break`);
      if (text === words) {
        const kept = t.lines.join(" ").slice(0, -3);
        assert.strictEqual(text[kept.length], " ", `${name}: "${last}"`);
      }
    }
});

it("a title's own truncateWord decides how it is cut", () => {
  const word = "GrossDomesticProductPerCapitaInConstantInternationalDollars";
  const kept = axis(AxisBottom, word, {titleConfig: {truncateWord: false}});
  const untitled = axis(AxisBottom, "");
  assert.strictEqual(
    (measureAxis(kept), kept._margin.bottom),
    (measureAxis(untitled), untitled._margin.bottom),
    "a word left uncut draws nothing",
  );
  const cut = axis(AxisBottom, words, {
    height: 70,
    titleConfig: {truncateWord: true},
  });
  const [mid] = cut._titleClass._textData();
  const [whole] = cut._titleClass.truncateWord(false)._textData();
  assert.notDeepStrictEqual(mid.lines, whole.lines, "cut mid-word");
});

it("a title that draws nothing claims no room", () => {
  const a = axis(AxisBottom, "Year");
  // Narrower than one character and its ellipsis.
  assert.strictEqual(titleRoom(a, [0, 8], 100), 0);
  assert.strictEqual(titleRoom(a, [0, 300], 100), Math.ceil(12 * 1.2) + 5);
});
