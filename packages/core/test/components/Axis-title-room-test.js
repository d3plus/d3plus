import {it} from "vitest";
import assert from "assert";
import {AxisBottom, AxisLeft, AxisRight, AxisTop} from "../../index.ts";
import {measureAxis} from "../../src/components/Axis/axisLayout.ts";
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
