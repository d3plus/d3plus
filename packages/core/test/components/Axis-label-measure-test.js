import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    Axes lay out the same labels whether each layout pass measures its labels
    afresh and thins a discrete axis one interval at a time (as they once
    did, kept here as the reference), or a draw shares its measurements and
    thinning starts past the intervals that surely crowd.
*/

const SESSION = "../../src/components/Axis/labelSizeSession.ts";
const THINNING = "../../src/components/Axis/axisLabelThinning.ts";

afterEach(() => {
  vi.doUnmock(SESSION);
  vi.doUnmock(THINNING);
  vi.resetModules();
});

/** Each pass measuring afresh, and thinning tried at every interval. */
function referenceModules(calls) {
  vi.doMock(SESSION, () => ({
    labelSizeSession: fn => fn(),
    labelSizes: () => new Map(),
  }));
  vi.doMock(THINNING, async importOriginal => {
    const original = await importOriginal();
    const {labelExtent} = original;
    const crowds = (a, b, horizontal) =>
      Math.abs(b.position - a.position) -
        (labelExtent(a, horizontal) + labelExtent(b, horizontal)) / 2 <
      b.fP;
    return {
      ...original,
      thinEvenly: (textData, horizontal, show) => {
        calls.thinEvenly++;
        let step = 1;
        const crowded = n => {
          for (let i = n; i < textData.length; i += n)
            if (crowds(textData[i - n], textData[i], horizontal)) return true;
          return false;
        };
        while (step < textData.length && crowded(step)) {
          step++;
          show?.(step, false);
        }
        if (step > 1) show?.(step, true);
        textData.forEach((datum, i) => (datum.truncated = i % step !== 0));
      },
    };
  });
}

const range = (n, step) => Array.from({length: n}, (_, i) => step(i));
const days = range(400, i => new Date(2020, 0, 1 + i));
const months = range(48, i => new Date(2020, i, 1));
const words = ["Apples", "Pears", "Plums", "Kiwis", "Figs", "Dates", "Limes"];

/** Ordinary axes over each scale and kind of label: `[name, Axis class name, config]`. */
const ordinary = [
  ["words", "AxisBottom", {scale: "point", domain: words, width: 400}],
  [
    "crowded words",
    "AxisBottom",
    {
      scale: "point",
      domain: words.concat(words.map(w => `${w} pie`)),
      width: 260,
    },
  ],
  ["band", "AxisLeft", {scale: "band", domain: words, height: 120, width: 200}],
  ["band across", "AxisBottom", {scale: "band", domain: words, width: 220}],
  ["linear", "AxisBottom", {scale: "linear", domain: [0, 1234567], width: 300}],
  [
    "linear left",
    "AxisLeft",
    {scale: "linear", domain: [-50, 50], height: 200, width: 200},
  ],
  [
    "log",
    "AxisLeft",
    {scale: "log", domain: [1, 1e6], height: 300, width: 200},
  ],
  [
    "time",
    "AxisBottom",
    {scale: "time", domain: [days[0], days[399]], data: days, width: 700},
  ],
  [
    "narrow time",
    "AxisBottom",
    {
      scale: "time",
      domain: [days[0], days[60]],
      data: days.slice(0, 61),
      width: 180,
    },
  ],
  [
    "month categories",
    "AxisBottom",
    {scale: "point", domain: months, width: 360},
  ],
  [
    "year categories",
    "AxisBottom",
    {scale: "band", domain: range(12, i => 2010 + i), width: 160},
  ],
  [
    "rotated",
    "AxisBottom",
    {
      scale: "point",
      domain: words.map(w => `${w} and more ${w}`),
      width: 200,
      labelRotation: true,
    },
  ],
  [
    "long labels",
    "AxisBottom",
    {
      scale: "point",
      domain: ["Supercalifragilistic", ..."bcdefghijklmnop"],
      width: 400,
    },
  ],
  [
    "long wrapping labels",
    "AxisLeft",
    {
      scale: "band",
      domain: words.map(w => `A rather long label for ${w}`),
      height: 200,
      width: 160,
    },
  ],
  [
    "long last label",
    "AxisBottom",
    {
      scale: "linear",
      domain: [0, 30],
      ticks: [...Array(31).keys()],
      tickFormat: d => (d === 30 ? "Thirty and then some" : `${d}`),
      width: 400,
    },
  ],
];

/** Dense axes: thousands of categories or dates. */
const dense = [
  [
    "dense numbers",
    "AxisBottom",
    {scale: "point", domain: [...Array(3000).keys()], width: 600},
  ],
  ["dense days", "AxisBottom", {scale: "point", domain: days, width: 600}],
];

/** Renders every case and reports what each axis laid out. */
async function layouts(cases) {
  const lib = await import("../../index.ts");
  return cases.map(([name, Axis, {width, height = 100, data, ...config}]) => {
    document.body.innerHTML = "";
    const axis = new lib[Axis]()
      .config(config)
      .width(width)
      .height(height)
      .duration(0);
    if (data) axis.data(data);
    axis.render();
    const tickData = axis._tickShape.data().map(d => {
      const out = {};
      for (const [k, v] of Object.entries(d))
        if (typeof v !== "function") out[k] = v instanceof Date ? +v : v;
      return out;
    });
    const shown = tickData.filter(d => d.text).map(d => d.text);
    return {name, shown, tickData};
  });
}

/** The reference layouts, then the current ones. */
async function compare(cases) {
  const calls = {thinEvenly: 0};
  vi.resetModules();
  referenceModules(calls);
  const expected = await layouts(cases);
  vi.doUnmock(SESSION);
  vi.doUnmock(THINNING);
  vi.resetModules();
  return {expected, actual: await layouts(cases), calls};
}

it("ordinary axes show the same labels and lay out the same ticks", async () => {
  const {expected, actual, calls} = await compare(ordinary);
  assert.ok(calls.thinEvenly > 0, "the reference thinning ran");
  actual.forEach((layout, i) => {
    assert.ok(layout.shown.length > 0, `${layout.name}: shows labels`);
    assert.deepStrictEqual(layout, expected[i], layout.name);
  });
});

it("dense axes show the same labels", async () => {
  const {expected, actual} = await compare(dense);
  actual.forEach((layout, i) => {
    assert.ok(layout.shown.length > 1, `${layout.name}: shows labels`);
    assert.deepStrictEqual(layout.shown, expected[i].shown, layout.name);
  });
});

it("a chart's axes share their label measurements within one draw", async () => {
  const {labelSizeSession, labelSizes} = await import(SESSION);
  const outside = labelSizes();
  assert.notStrictEqual(labelSizes(), outside, "a fresh map outside a session");
  labelSizeSession(() => {
    const shared = labelSizes();
    assert.strictEqual(labelSizes(), shared);
    labelSizeSession(() =>
      assert.strictEqual(labelSizes(), shared, "a nested session joins it"),
    );
    assert.strictEqual(labelSizes(), shared);
  });
  assert.throws(() =>
    labelSizeSession(() => {
      throw new Error("draw failed");
    }),
  );
  labelSizeSession(() =>
    assert.notStrictEqual(labelSizes(), outside, "closed after a failure"),
  );
});
