import {it} from "vitest";
import assert from "assert";
import {hoverTickValues} from "../../src/charts/features/hoverTicks.ts";
import {bandTicks} from "../../src/charts/Priestley/applyLayout.ts";

it("hoverTickValues reads the values a field stamped on tick labels, in order", () => {
  const label = (value, field = "x") => ({
    type: "text",
    hoverMatch: {field, value},
  });
  const axis = {
    type: "group",
    children: [
      label(1),
      {type: "group", children: [label(2), label(9, "y")]},
      {type: "line"},
      label(3),
    ],
  };
  assert.deepStrictEqual(hoverTickValues(axis, "x"), [1, 2, 3]);
  assert.deepStrictEqual(hoverTickValues(axis, "y"), [9]);
  assert.deepStrictEqual(hoverTickValues({type: "line"}, "x"), []);
});

it("bandTicks keeps the ticks within a band, its ends included", () => {
  const ticks = [2000, 2002, 2004, 2006];
  assert.deepStrictEqual(
    bandTicks(ticks, {start: 2002, end: 2005}),
    [2002, 2004],
  );
  assert.deepStrictEqual(bandTicks(ticks, {start: 2001, end: 2001.5}), []);
  const dates = ticks.map(y => new Date(y, 0, 1));
  assert.deepStrictEqual(
    bandTicks(dates, {start: new Date(2003, 0, 1), end: new Date(2006, 0, 1)}),
    dates.slice(2),
    "dates compare by time",
  );
});
