import {it} from "vitest";
import assert from "assert";
import {
  RANGE_SELECTOR_DEFAULT,
  coversAll,
  parseRangeButton,
  rangeAriaLabel,
  rangeButtons,
  rangeLabel,
  rangeWindow,
} from "../../src/charts/drawSteps/rangeSelectorButtons.ts";
import {LinePlot} from "../../index.ts";
import {shownRangeButtons} from "../../src/charts/drawSteps/rangeSelector.ts";

/**
    `rangeSelectorButtons.ts`: reading `rangeSelector` entries, the window
    of dates each button shows, and its label and spoken label.
*/

it("parseRangeButton: reads short forms in either case", () => {
  assert.deepStrictEqual(parseRangeButton("1M"), {step: "month", count: 1});
  assert.deepStrictEqual(parseRangeButton("6m"), {step: "month", count: 6});
  assert.deepStrictEqual(parseRangeButton("2W"), {step: "week", count: 2});
  assert.deepStrictEqual(parseRangeButton("10d"), {step: "day", count: 10});
  assert.deepStrictEqual(parseRangeButton("5Y"), {step: "year", count: 5});
  assert.deepStrictEqual(parseRangeButton("ytd"), {step: "ytd"});
  assert.deepStrictEqual(parseRangeButton("All"), {step: "all"});
});

it("parseRangeButton: reads button objects, defaulting count to 1", () => {
  assert.deepStrictEqual(parseRangeButton({step: "month", count: 3}), {
    step: "month",
    count: 3,
  });
  assert.deepStrictEqual(parseRangeButton({step: "year", label: "Year"}), {
    step: "year",
    count: 1,
    label: "Year",
  });
});

it("parseRangeButton: rejects anything else", () => {
  for (const bad of [
    "",
    "M",
    "0M",
    "3Q",
    "-1Y",
    {step: "hour"},
    {step: "day", count: 0},
    null,
    3,
  ])
    assert.strictEqual(parseRangeButton(bad), null, JSON.stringify(bad));
});

it("rangeButtons: true shows the defaults, a list its valid entries, anything else none", () => {
  assert.deepStrictEqual(
    rangeButtons(true),
    RANGE_SELECTOR_DEFAULT.map(parseRangeButton),
  );
  assert.deepStrictEqual(rangeButtons(["3M", "bogus", "All"]), [
    {step: "month", count: 3},
    {step: "all"},
  ]);
  assert.deepStrictEqual(rangeButtons(false), []);
  assert.deepStrictEqual(rangeButtons(undefined), []);
});

const extent = [+new Date(2022, 0, 1), +new Date(2024, 5, 15)];

it("rangeWindow: steps back from the data's last date", () => {
  assert.deepStrictEqual(rangeWindow({step: "month", count: 6}, extent), [
    +new Date(2023, 11, 15),
    extent[1],
  ]);
  assert.deepStrictEqual(rangeWindow({step: "week", count: 1}, extent), [
    +new Date(2024, 5, 8),
    extent[1],
  ]);
  assert.deepStrictEqual(rangeWindow({step: "day", count: 10}, extent), [
    +new Date(2024, 5, 5),
    extent[1],
  ]);
});

it("rangeWindow: YTD starts at the start of the last date's year", () => {
  assert.deepStrictEqual(rangeWindow({step: "ytd"}, extent), [
    +new Date(2024, 0, 1),
    extent[1],
  ]);
});

it("rangeWindow: stops at the data's first date, and is null for All", () => {
  assert.deepStrictEqual(rangeWindow({step: "year", count: 5}, extent), [
    extent[0],
    extent[1],
  ]);
  assert.strictEqual(rangeWindow({step: "all"}, extent), null);
});

it("rangeWindow: a month or year back from a day the earlier month lacks lands on its last day", () => {
  const march = [+new Date(2023, 0, 1), +new Date(2024, 2, 31)];
  assert.deepStrictEqual(rangeWindow({step: "month", count: 1}, march), [
    +new Date(2024, 1, 29),
    march[1],
  ]);
  const leap = [+new Date(2020, 0, 1), +new Date(2024, 1, 29)];
  assert.deepStrictEqual(rangeWindow({step: "year", count: 1}, leap), [
    +new Date(2023, 1, 28),
    leap[1],
  ]);
});

it("rangeWindow: steps in UTC on a UTC axis", () => {
  const utc = [Date.UTC(2023, 0, 1), Date.UTC(2024, 2, 31)];
  assert.deepStrictEqual(rangeWindow({step: "month", count: 1}, utc, true), [
    Date.UTC(2024, 1, 29),
    utc[1],
  ]);
  assert.deepStrictEqual(rangeWindow({step: "ytd"}, utc, true), [
    Date.UTC(2024, 0, 1),
    utc[1],
  ]);
});

it("coversAll: whether a button's window takes in the whole span", () => {
  assert.strictEqual(coversAll({step: "month", count: 6}, extent), false);
  assert.strictEqual(coversAll({step: "year", count: 5}, extent), true);
  assert.strictEqual(coversAll({step: "all"}, extent), true);
  // Four months of data within one year: YTD shows all of it.
  const short = [+new Date(2024, 2, 1), +new Date(2024, 6, 1)];
  assert.strictEqual(coversAll({step: "ytd"}, short), true);
  assert.strictEqual(coversAll({step: "month", count: 1}, short), false);
});

it("rangeLabel / rangeAriaLabel: short and spoken labels, in English", () => {
  const {translate} = new LinePlot().schema;
  const label = b => rangeLabel(parseRangeButton(b), translate);
  const aria = b => rangeAriaLabel(parseRangeButton(b), translate);
  assert.deepStrictEqual(
    ["1M", "6M", "2W", "3D", "1Y", "YTD", "All"].map(label),
    ["1M", "6M", "2W", "3D", "1Y", "YTD", "All"],
  );
  assert.deepStrictEqual(
    ["1D", "3D", "1W", "2W", "1M", "6M", "1Y", "5Y", "YTD", "All"].map(aria),
    [
      "Last day",
      "Last 3 days",
      "Last week",
      "Last 2 weeks",
      "Last month",
      "Last 6 months",
      "Last year",
      "Last 5 years",
      "Year to date",
      "Full range",
    ],
  );
});

it("rangeLabel / rangeAriaLabel: translated with the chart's locale", () => {
  const {schema} = new LinePlot().locale("es-ES");
  const translate = (d, locale = schema.locale, ...args) =>
    schema.translate(d, locale, ...args);
  assert.strictEqual(rangeLabel({step: "month", count: 6}, translate), "6 m");
  assert.strictEqual(rangeLabel({step: "all"}, translate), "Todo");
  assert.strictEqual(
    rangeAriaLabel({step: "month", count: 6}, translate),
    "Últimos 6 meses",
  );
  assert.strictEqual(
    rangeAriaLabel({step: "ytd"}, translate),
    "En lo que va del año",
  );
});

it("rangeLabel: a button's own label wins, and still has a spoken label", () => {
  const {translate} = new LinePlot().schema;
  const button = parseRangeButton({step: "week", count: 2, label: "Fortnight"});
  assert.strictEqual(rangeLabel(button, translate), "Fortnight");
  assert.strictEqual(rangeAriaLabel(button, translate), "Last 2 weeks");
});

it("shownRangeButtons: hides a button whose window takes in all the data", () => {
  const buttons = rangeButtons(["1M", "6M", "YTD", "1Y", "All"]);
  const short = [+new Date(2024, 2, 1), +new Date(2024, 6, 1)];
  assert.deepStrictEqual(
    shownRangeButtons(buttons, short).map(b => [b.button.step, b.index]),
    [
      ["month", 0],
      ["all", 4],
    ],
  );
  // Every button shows before the data's extent is known.
  assert.strictEqual(shownRangeButtons(buttons, undefined).length, 5);
});

it("shownRangeButtons: none show when only All would be left", () => {
  const buttons = rangeButtons(["1M", "1Y", "All"]);
  const days = [+new Date(2024, 2, 1), +new Date(2024, 2, 20)];
  assert.deepStrictEqual(shownRangeButtons(buttons, days), []);
  assert.deepStrictEqual(shownRangeButtons(rangeButtons(["All"]), days), []);
});
