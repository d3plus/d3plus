import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot, Plot, Scatter} from "../../index.ts";
import {resolveDiscrete} from "../../src/charts/Plot/inferDiscrete.ts";
import {timeNestKeys} from "../../src/charts/Plot/timeNestKeys.ts";

useJsdom();

/**
    `timeNestKeys` lists the accessors of a Plot's time axes, which the
    rollup nests rows by so rows at different times never merge.
*/

const rows = [0, 1, 2].map(i => ({
  id: "a",
  date: new Date(2020, i, 1),
  day: `2020-0${i + 1}-01`,
  ms: +new Date(2020, i, 1),
  value: i + 1,
  fruit: ["Apples", "Pears", "Plums"][i],
}));

/** The nest keys of `viz`, after it notes its discrete axis, as the values they read off the first row. */
const keysOf = viz => {
  resolveDiscrete(viz);
  return timeNestKeys(viz).map(key => key(rows[0], 0));
};

it("timeNestKeys — an axis of Dates, or with a time scale", () => {
  assert.deepStrictEqual(keysOf(new Plot().data(rows).x("date").y("value")), [
    rows[0].date,
  ]);
  assert.deepStrictEqual(
    keysOf(new Plot().data(rows).x("value").y("date")),
    [rows[0].date],
    "a y axis of Dates",
  );
  assert.deepStrictEqual(
    keysOf(new Plot().data(rows).x("day").y("value").xConfig({scale: "time"})),
    [rows[0].day],
    "date strings on a time scale",
  );
  assert.deepStrictEqual(
    keysOf(new Plot().data(rows).x("ms").y("value").xConfig({scale: "utc"})),
    [rows[0].ms],
    "timestamps on a utc scale",
  );
});

it("timeNestKeys — the axis that plots time, or reads dates through rangeBreaks", () => {
  assert.deepStrictEqual(
    keysOf(new Scatter().data(rows).x("day").y("value").time("day")),
    [rows[0].day],
  );
  assert.deepStrictEqual(
    keysOf(
      new Scatter()
        .data(rows)
        .x("day")
        .y("value")
        .xConfig({rangeBreaks: ["weekends"]}),
    ),
    [rows[0].day],
  );
});

it("timeNestKeys — none for numeric or category axes, or the discrete axis", () => {
  assert.deepStrictEqual(
    keysOf(new Plot().data(rows).x("value").y("value")),
    [],
  );
  assert.deepStrictEqual(keysOf(new Plot().data(rows).x("day").y("value")), []);
  assert.deepStrictEqual(
    keysOf(new Scatter().data(rows).x("fruit").y("value")),
    [],
  );
  assert.deepStrictEqual(
    keysOf(new LinePlot().data(rows).x("date").y("value")),
    [],
    "LinePlot's discrete x nests its rows already",
  );
  assert.deepStrictEqual(
    keysOf(new Plot().x("date").y("value")),
    [],
    "no data",
  );
});
