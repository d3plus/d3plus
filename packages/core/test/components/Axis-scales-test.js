import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {AxisBottom} from "../../index.ts";
import {
  axisScales,
  drawnAxisScale,
  isTimeScaleName,
} from "../../src/components/Axis/axisScaleType.ts";
import {configUtc} from "../../src/components/Axis/timeValues.ts";
import {configWarnings} from "../../src/utils/configWarnings.ts";

/**
    The scales an Axis draws (`AxisConfig.scale`): each draws ticks and
    labels, `"utc"` is a time scale read in UTC, and any other name warns
    and draws linear.
*/

useJsdom();

/** A domain each scale draws. */
const domains = {
  band: ["Apples", "Bananas", "Cherries"],
  linear: [0, 100],
  log: [1, 10000],
  ordinal: ["Apples", "Bananas", "Cherries"],
  point: ["Apples", "Bananas", "Cherries"],
  pow: [0, 100],
  sqrt: [0, 100],
  time: [new Date(2024, 0, 1), new Date(2024, 11, 1)],
  utc: [new Date(Date.UTC(2024, 0, 1)), new Date(Date.UTC(2024, 11, 1))],
};

/** Draws a standalone axis and reads its labels. */
function draw(scale, domain) {
  document.body.innerHTML = "";
  const axis = new AxisBottom()
    .scale(scale)
    .domain(domain)
    .width(600)
    .height(80)
    .duration(0);
  axis.render();
  const svg = document.querySelector("svg.d3plus-render-svg");
  return {
    axis,
    html: svg.outerHTML,
    labels: [...svg.querySelectorAll("text")].map(t => t.textContent),
  };
}

/** Runs `fn` collecting console warnings. */
function warnings(fn) {
  const out = [];
  const warn = console.warn;
  console.warn = msg => out.push(msg);
  try {
    configWarnings(true);
    fn();
  } finally {
    console.warn = warn;
  }
  return out;
}

it("axisScales lists the scales an Axis draws", () => {
  assert.deepStrictEqual([...axisScales].sort(), Object.keys(domains).sort());
});

for (const scale of axisScales) {
  it(`scale "${scale}" draws its ticks and labels without warning`, () => {
    let out;
    const warned = warnings(() => (out = draw(scale, domains[scale])));
    assert.deepStrictEqual(warned, []);
    assert.ok(out.labels.length >= 3, `labels drawn (${out.labels})`);
    assert.ok(!out.html.includes("NaN"), "no NaN in the markup");
  });
}

it('scale "utc" is a time scale read in UTC', () => {
  const axis = new AxisBottom().scale("utc");
  assert.strictEqual(axis.scale(), "time");
  assert.strictEqual(axis.utc(), true);
  assert.strictEqual(new AxisBottom().scale("time").utc(), false);
  const {labels} = draw("utc", domains.utc);
  assert.strictEqual(labels[0], "Jan 2024");
});

it("a name the Axis doesn't draw warns once and draws linear", () => {
  let out;
  const warned = warnings(() => {
    out = draw("symlog", [0, 100]);
    draw("symlog", [0, 100]);
  });
  assert.deepStrictEqual(warned, [
    'Axis received unknown scale "symlog"; using "linear". Use one of "band", "linear", "log", "ordinal", "point", "pow", "sqrt", "time", "utc".',
  ]);
  const linear = draw("linear", [0, 100]);
  assert.deepStrictEqual(out.labels, linear.labels);
});

it("drawnAxisScale passes drawn scales and falls back to linear", () => {
  warnings(() => {
    axisScales.forEach(s => assert.strictEqual(drawnAxisScale(s), s));
    ["jenks", "quantile", "threshold", "radial", "auto", undefined].forEach(s =>
      assert.strictEqual(drawnAxisScale(s), "linear"),
    );
  });
});

it("isTimeScaleName reads time and utc as time", () => {
  assert.ok(isTimeScaleName("time"));
  assert.ok(isTimeScaleName("utc"));
  assert.ok(!isTimeScaleName("linear"));
  assert.ok(!isTimeScaleName(undefined));
});

it('configUtc reads scale: "utc" as utc', () => {
  assert.ok(configUtc({scale: "utc"}));
  assert.ok(!configUtc({scale: "time"}));
});
