import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    An axis lays out the same ticks, labels, and tick data whether its
    label thinning and tick lookups scan arrays (as they once did, kept here
    as the reference) or run in one pass with indexed lookups.
*/

const THINNING = "../../src/components/Axis/axisLabelThinning.ts";
const LOOKUPS = "../../src/components/Axis/axisTickLookups.ts";

afterEach(() => {
  vi.doUnmock(THINNING);
  vi.doUnmock(LOOKUPS);
  vi.resetModules();
});

/** The thinning and lookups as array scans, counting how often each runs. */
function referenceModules(calls) {
  vi.doMock(THINNING, async importOriginal => {
    const original = await importOriginal();
    const {labelExtent} = original;
    const crowds = (a, b, horizontal) =>
      Math.abs(b.position - a.position) -
        (labelExtent(a, horizontal) + labelExtent(b, horizontal)) / 2 <
      b.fP;
    const thinGreedily = (textData, horizontal) => {
      calls.thinGreedily++;
      const reverseTextData = textData.slice().reverse();
      textData.forEach(datum => {
        const {fP, i, position} = datum;
        const extent = t => labelExtent(t, horizontal);
        let prev = i
          ? reverseTextData.find(t => t.i < i && !t.truncated)
          : undefined;
        if (i === textData.length - 1) {
          while (
            prev &&
            position - extent(datum) / 2 - fP < prev.position + extent(prev) / 2
          ) {
            prev.truncated = true;
            prev = reverseTextData.find(t => t.i < i && !t.truncated);
          }
        }
        datum.truncated = prev
          ? position - extent(datum) / 2 - fP < prev.position + extent(prev) / 2
          : false;
      });
    };
    return {
      ...original,
      thinGreedily,
      thinGreedilyShown: (textData, horizontal, show) => {
        let shown = textData;
        for (let round = 0; round < 4; round++) {
          thinGreedily(textData, horizontal);
          const next = textData.filter(t => !t.truncated);
          if (
            next.length === shown.length &&
            next.every((t, i) => t === shown[i])
          )
            return;
          shown = next;
          show(shown, textData);
        }
      },
      thinEvenly: (textData, horizontal, show) => {
        calls.thinEvenly++;
        let step = 1;
        const crowded = n =>
          textData.some(
            (datum, i) =>
              i >= n &&
              i % n === 0 &&
              crowds(textData[i - n], datum, horizontal),
          );
        while (step < textData.length && crowded(step)) {
          step++;
          show?.(step, false);
        }
        if (step > 1) show?.(step, true);
        textData.forEach((datum, i) => (datum.truncated = i % step !== 0));
      },
    };
  });
  vi.doMock(LOOKUPS, () => ({
    tickLookups: (ticks, labels, textData, scaleData) => {
      calls.tickLookups++;
      return {
        isTick: d => ticks.includes(d),
        isLabel: d => labels.includes(d),
        text: d => textData.find(t => t.d === d),
        scaleValue: d => scaleData.find(t => +t === d),
      };
    },
  }));
}

const days = Array.from({length: 400}, (_, i) => new Date(2020, 0, 1 + i));
const words = ["Apples", "Pears", "Plums", "Kiwis", "Figs", "Dates", "Limes"];

/** Axes over varied scales, values, and sizes: `[name, Axis class name, config]`. */
const cases = [
  [
    "dense point",
    "AxisBottom",
    {scale: "point", domain: [...Array(3000).keys()], width: 600},
  ],
  [
    "point with words",
    "AxisBottom",
    {
      scale: "point",
      domain: words.concat(words.map(w => `${w} pie`)),
      width: 260,
    },
  ],
  ["band", "AxisLeft", {scale: "band", domain: words, height: 120, width: 200}],
  ["linear", "AxisBottom", {scale: "linear", domain: [0, 1234567], width: 300}],
  [
    "linear ticks",
    "AxisBottom",
    {
      scale: "linear",
      domain: [0, 100],
      ticks: [0, 0, 5, 10, 11, 50, 99, 100],
      labels: [0, 10, 11, 100],
      width: 240,
    },
  ],
  [
    "log",
    "AxisLeft",
    {scale: "log", domain: [1, 1e6], height: 300, width: 200},
  ],
  [
    "time",
    "AxisBottom",
    {
      scale: "time",
      domain: [days[0], days[days.length - 1]],
      data: days,
      width: 700,
    },
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
    "one long label",
    "AxisBottom",
    {
      scale: "point",
      domain: ["Supercalifragilistic", ..."bcdefghijklmnop"],
      width: 400,
    },
  ],
  [
    "one long last label",
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

/** Renders every case and reports what each axis laid out. */
async function layouts() {
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
    return {
      name,
      available: (axis._availableTicks || []).map(Number),
      visible: (axis._visibleTicks || []).map(Number),
      shown: (axis._shownLabels || []).map(String),
      tickData,
    };
  });
}

it("lays out the same ticks, labels, and tick data as array scans", async () => {
  const calls = {thinGreedily: 0, thinEvenly: 0, tickLookups: 0};
  vi.resetModules();
  referenceModules(calls);
  const expected = await layouts();
  vi.doUnmock(THINNING);
  vi.doUnmock(LOOKUPS);
  vi.resetModules();
  const actual = await layouts();
  // Each reference ran, so both thinning paths and the lookups were compared.
  assert.ok(calls.thinGreedily > 0, "thinGreedily");
  assert.ok(calls.thinEvenly > 0, "thinEvenly");
  assert.ok(calls.tickLookups >= cases.length, "tickLookups");
  actual.forEach((layout, i) => {
    assert.ok(layout.tickData.length > 0, `${layout.name}: draws ticks`);
    assert.deepStrictEqual(layout, expected[i], layout.name);
  });
});
