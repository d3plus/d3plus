import {it} from "vitest";
import assert from "assert";

import {
  barCategoryLabelsFit,
  barLabelRoom,
  barLabelsFit,
} from "../../src/charts/Plot/barLabelFit.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/** A BarChart's default bar `labelConfig` (see `Plot/shapeDefaults.ts`). */
const labelConfig = {fontMax: 16, fontMin: 6, fontResize: true, padding: 3};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/** One bar row per label, along `discrete`. */
const rowsFor = (labels, discrete = "x") =>
  labels.map((label, i) => ({[discrete]: label, data: {label}, i}));

it("barLabelRoom: vertical bars split the width, and get half the height", () => {
  assert.deepStrictEqual(
    barLabelRoom("x", {width: 600, height: 400}, 12, 1, {group: 5, bar: 0}),
    {width: 45, height: 200},
  );
});

it("barLabelRoom: horizontal bars split the height, and get half the width", () => {
  assert.deepStrictEqual(
    barLabelRoom("y", {width: 600, height: 400}, 10, 1, {group: 5, bar: 0}),
    {width: 300, height: 35},
  );
});

it("barLabelRoom: grouped bars split their category's band", () => {
  const room = barLabelRoom("x", {width: 600, height: 400}, 6, 2, {
    group: 10,
    bar: 2,
  });
  // (100 - 10 - 2 * 2 - 1) / 2
  assert.strictEqual(room.width, 42.5);
});

it("barLabelRoom: groupPadding wider than the band is ignored, and room never goes negative", () => {
  assert.strictEqual(
    barLabelRoom("x", {width: 40, height: 400}, 10, 1, {group: 5, bar: 0})
      .width,
    4,
  );
  assert.strictEqual(
    barLabelRoom("x", {width: 40, height: 400}, 10, 3, {group: 5, bar: 4})
      .width,
    0,
  );
});

it("barLabelsFit: labels fit in roomy bars", () => {
  const labels = months.map(m => `${m} 2024`);
  assert.strictEqual(
    barLabelsFit(
      labels,
      rowsFor(labels),
      {width: 50, height: 200},
      labelConfig,
    ),
    true,
  );
});

it("barLabelsFit: labels don't fit in bars narrower than their words", () => {
  const labels = months.map(m => `${m} 2024`);
  assert.strictEqual(
    barLabelsFit(
      labels,
      rowsFor(labels),
      {width: 12, height: 200},
      labelConfig,
    ),
    false,
  );
});

it("barLabelsFit: one label that doesn't fit is enough", () => {
  const labels = ["A", "B", "1234567890"];
  assert.strictEqual(
    barLabelsFit(
      labels,
      rowsFor(labels),
      {width: 30, height: 200},
      labelConfig,
    ),
    false,
  );
  assert.strictEqual(
    barLabelsFit(
      labels.slice(0, 2),
      rowsFor(labels.slice(0, 2)),
      {width: 30, height: 200},
      labelConfig,
    ),
    true,
  );
});

it("barLabelsFit: thin horizontal bars can't hold a line of text", () => {
  const labels = months.map(m => `${m} 2024`);
  assert.strictEqual(
    barLabelsFit(labels, rowsFor(labels), {width: 300, height: 8}, labelConfig),
    false,
  );
});

it("barLabelsFit: reads a function config value per row, against its data", () => {
  const seen = [];
  const config = {
    ...labelConfig,
    fontMin: (d, i) => {
      seen.push([d.label, i]);
      return 6;
    },
  };
  const labels = ["Jan", "Feb"];
  barLabelsFit(labels, rowsFor(labels), {width: 50, height: 200}, config);
  assert.ok(seen.some(([label, i]) => label === "Feb" && i === 1));
});

it("barLabelsFit: no labels always fit", () => {
  assert.strictEqual(
    barLabelsFit([], [], {width: 0, height: 0}, labelConfig),
    true,
  );
});

it("barCategoryLabelsFit: 12 month bars fit a 650px plot, 36 don't", () => {
  const viz = {schema: {discrete: "x", barPadding: 0}, _groupPadding: 5};
  const plot = {width: 650, height: 400};
  const year = months.concat(months).map((m, i) => `${m} ${2022 + (i > 5)}`);
  const three = [...year, ...year, ...year].map((l, i) => `${l} ${i}`);
  assert.strictEqual(
    barCategoryLabelsFit(viz, rowsFor(year), year, plot, labelConfig),
    true,
  );
  assert.strictEqual(
    barCategoryLabelsFit(viz, rowsFor(three), three, plot, labelConfig),
    false,
  );
});

it("barCategoryLabelsFit: horizontal bars read their categories along y", () => {
  const viz = {schema: {discrete: "y", barPadding: 0}, _groupPadding: 5};
  const labels = Array.from({length: 40}, (_, i) => `Category ${i}`);
  assert.strictEqual(
    barCategoryLabelsFit(
      viz,
      rowsFor(labels, "y"),
      labels,
      {width: 600, height: 400},
      labelConfig,
    ),
    false,
  );
  assert.strictEqual(
    barCategoryLabelsFit(
      viz,
      rowsFor(labels.slice(0, 5), "y"),
      labels.slice(0, 5),
      {width: 600, height: 400},
      labelConfig,
    ),
    true,
  );
});

it("barCategoryLabelsFit: stacked bars count one bar per category", () => {
  const rows = [
    {x: "Q1", data: {label: "Q1"}, i: 0},
    {x: "Q1", data: {label: "Q1"}, i: 1},
    {x: "Q1", data: {label: "Q1"}, i: 2},
  ];
  const plot = {width: 30, height: 400};
  const labels = ["Q1", "Q1", "Q1"];
  const base = {barPadding: 0, discrete: "x"};
  assert.strictEqual(
    barCategoryLabelsFit(
      {schema: {...base, stacked: true}, _groupPadding: 0},
      rows,
      labels,
      plot,
      labelConfig,
    ),
    true,
  );
  assert.strictEqual(
    barCategoryLabelsFit(
      {schema: base, _groupPadding: 0},
      rows,
      labels,
      plot,
      labelConfig,
    ),
    false,
  );
});
