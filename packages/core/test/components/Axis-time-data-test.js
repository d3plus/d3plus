import assert from "assert";
import {date} from "@d3plus/dom";
import {AxisBottom, AxisLeft, Timeline} from "../../es/index.js";
import {
  axisScaleData,
  axisTimeDomain,
  parseTime,
  parseTimeValues,
} from "../../es/src/components/Axis/timeValues.js";
import it from "../jsdom.js";

/**
    A time-scale Axis parses its `data` (Date objects, timestamps, or any
    string `date()` reads) before the scale uses it, so every input form draws
    the same ticks and labels, and values that do not parse are dropped.
*/

/** Renders a standalone time-scale axis and returns its painted markup and label text. */
function draw({
  data,
  domain,
  ticks,
  labels,
  locale,
  width = 500,
  height = 100,
  Ctor = AxisBottom,
}) {
  document.body.innerHTML = "";
  const axis = new Ctor().scale("time").width(width).height(height).duration(0);
  if (data) axis.data(data);
  if (domain) axis.domain(domain);
  if (ticks) axis.ticks(ticks);
  if (labels) axis.labels(labels);
  if (locale) axis.locale(locale);
  axis.render();
  const svg = document.querySelector("svg.d3plus-render-svg");
  return {
    axis,
    html: svg.outerHTML.replace(/Axis-[0-9a-f]{8}/g, "Axis-uuid"),
    labels: [...svg.querySelectorAll("text")].map(t => t.textContent),
  };
}

const ends = arr => [arr[0], arr[arr.length - 1]];

/** Asserts that string, Date, and timestamp versions of `strings` paint identically. */
function assertMatchesDates(name, strings, opts = {}) {
  const dates = strings.map(date);
  const asDates = draw({data: dates, domain: ends(dates), ...opts});
  assert.ok(!asDates.html.includes("NaN"), `${name}: Date input has no NaN`);
  assert.ok(asDates.labels.length > 0, `${name}: Date input draws labels`);

  const asStrings = draw({data: strings, domain: ends(strings), ...opts});
  assert.ok(
    !asStrings.html.includes("NaN"),
    `${name}: string input has no NaN`,
  );
  assert.deepStrictEqual(
    asStrings.labels,
    asDates.labels,
    `${name}: string labels match Dates`,
  );
  assert.strictEqual(
    asStrings.html,
    asDates.html,
    `${name}: string markup matches Dates`,
  );

  const stamps = dates.map(Number);
  const asStamps = draw({data: stamps, domain: ends(stamps), ...opts});
  assert.strictEqual(
    asStamps.html,
    asDates.html,
    `${name}: timestamp markup matches Dates`,
  );
}

const formats = {
  "ISO dates": [
    "2024-01-01",
    "2024-04-01",
    "2024-07-01",
    "2024-10-01",
    "2025-01-01",
  ],
  "ISO date-times": [
    "2024-01-01T00:00:00Z",
    "2024-02-01T00:00:00Z",
    "2024-03-01T00:00:00Z",
  ],
  "quarters (Q1 2024)": ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025"],
  "quarters (2024Q1)": ["2024Q1", "2024Q2", "2024Q3", "2024Q4"],
  "months (2024-01)": ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05"],
  "days (MM/DD/YYYY)": ["01/15/2024", "02/15/2024", "03/15/2024", "04/15/2024"],
  years: ["2018", "2019", "2020", "2021", "2022"],
};

for (const [name, strings] of Object.entries(formats)) {
  it(`time Axis: ${name} as strings draw the same as Dates and timestamps`, () => {
    assertMatchesDates(name, strings);
  });
}

it("time Axis: dense string data (scale-computed ticks) draws the same as Dates", () => {
  const strings = Array.from({length: 200}, (_, i) =>
    new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10),
  );
  assertMatchesDates("dense days", strings);
});

it("time Axis: a vertical axis parses string data", () => {
  assertMatchesDates("AxisLeft", formats["quarters (Q1 2024)"], {
    Ctor: AxisLeft,
    width: 100,
    height: 400,
  });
});

it("time Axis: the Quarters page's quarter strings draw the same as Dates", () => {
  const quarters = [];
  for (let y = 2019; y <= 2028; y++)
    for (let q = 1; q <= 4; q++) quarters.push(`Q${q} ${y}`);
  const strings = quarters.slice(3, -2); // Q4 2019 … Q2 2028
  assertMatchesDates("Quarters", strings, {locale: "ar-SA", height: 200});
});

it("time Axis: mixed Dates, timestamps, and strings draw the same as Dates", () => {
  const mixed = [
    date("2024-01-01"),
    "2024-04-01",
    +date("2024-07-01"),
    "Q4 2024",
  ];
  const dates = mixed.map(date);
  const asMixed = draw({data: mixed, domain: ends(mixed)});
  const asDates = draw({data: dates, domain: ends(dates)});
  assert.ok(!asMixed.html.includes("NaN"), "no NaN");
  assert.strictEqual(asMixed.html, asDates.html);
});

it("time Axis: unparseable data values are dropped", () => {
  const valid = ["2024-01-01", "2024-04-01", "2024-07-01", "2024-10-01"];
  const withBad = [
    "2024-01-01",
    "not a date",
    "2024-04-01",
    null,
    "2024-07-01",
    "n/a",
    undefined,
    "2024-10-01",
    false,
  ];
  const asDates = draw({data: valid.map(date), domain: ends(valid.map(date))});
  const asBad = draw({data: withBad, domain: ends(valid)});
  assert.ok(!asBad.html.includes("NaN"), "no NaN");
  assert.deepStrictEqual(
    asBad.axis._scaleData.map(Number),
    valid.map(d => +date(d)),
    "only the valid dates remain",
  );
  assert.strictEqual(
    asBad.html,
    asDates.html,
    "draws as if the bad values were absent",
  );
});

it("time Axis: all-unparseable data draws like no data", () => {
  const domain = ["2024-01-01", "2024-12-01"];
  const none = draw({domain});
  const bad = draw({data: ["nope", "n/a"], domain});
  assert.ok(!bad.html.includes("NaN"), "no NaN");
  assert.deepStrictEqual(bad.axis._scaleData, []);
  assert.strictEqual(bad.html, none.html);
});

it("time Axis: an unparseable domain end falls back to the data's extent", () => {
  const data = ["2024-01-01", "2024-04-01", "2024-07-01"];
  const good = draw({data, domain: ends(data)});
  const bad = draw({data, domain: ["nope", "2024-07-01"]});
  assert.ok(!bad.html.includes("NaN"), "no NaN");
  assert.strictEqual(bad.html, good.html);
});

it("time Axis: unparseable ticks and labels are dropped", () => {
  const data = ["2024-01-01", "2024-04-01", "2024-07-01", "2024-10-01"];
  const good = draw({
    data,
    domain: ends(data),
    ticks: ["2024-01-01", "2024-07-01"],
    labels: ["2024-01-01", "2024-07-01"],
  });
  const bad = draw({
    data,
    domain: ends(data),
    ticks: ["2024-01-01", "bad", "2024-07-01"],
    labels: ["2024-01-01", "2024-07-01", "n/a"],
  });
  assert.ok(!bad.html.includes("NaN"), "no NaN");
  assert.strictEqual(bad.html, good.html);
});

it("non-time Axis data is used as given", () => {
  document.body.innerHTML = "";
  const band = ["2024", "Q1 2024", "a"];
  const bandAxis = new AxisBottom()
    .scale("band")
    .domain(band)
    .data(band)
    .duration(0)
    .render();
  assert.strictEqual(bandAxis._scaleData, band, "band data is not parsed");
  const labels = [
    ...document.querySelectorAll("svg.d3plus-render-svg text"),
  ].map(t => t.textContent);
  assert.deepStrictEqual(labels, band);

  const nums = [1, 5, 10];
  const linearAxis = new AxisBottom()
    .domain([0, 10])
    .data(nums)
    .duration(0)
    .render();
  assert.strictEqual(linearAxis._scaleData, nums, "linear data is not parsed");
});

it("Timeline: string data with unparseable values draws without NaN", function* () {
  const valid = ["2018", "2019", "2020", "2021", "2022"];
  const paint = function* (data) {
    document.body.innerHTML = "";
    const tl = new Timeline()
      .domain(ends(valid))
      .data(data)
      .width(400)
      .height(100)
      .duration(0);
    yield cb => tl.render(cb);
    const svg = document.querySelector("svg.d3plus-render-svg");
    return {tl, html: svg.outerHTML.replace(/Axis-[0-9a-f]{8}/g, "Axis-uuid")};
  };
  const good = yield* paint(valid.map(date));
  const bad = yield* paint([
    "2018",
    "nope",
    "2019",
    null,
    "2020",
    "2021",
    "2022",
  ]);
  assert.ok(!bad.html.includes("NaN"), "no NaN");
  assert.deepStrictEqual(
    bad.tl.data().map(Number),
    valid.map(d => +date(d)),
  );
  assert.strictEqual(bad.html, good.html);
});

it("parseTime parses dates, timestamps, and strings, and rejects the rest", () => {
  const d = new Date(2024, 0, 1);
  assert.strictEqual(parseTime(d), d, "a Date passes through");
  assert.strictEqual(+parseTime(+d), +d, "a timestamp parses");
  assert.strictEqual(+parseTime("Q1 2024"), +d, "a quarter string parses");
  assert.strictEqual(+parseTime("2024-01-01"), +d, "an ISO day parses");
  for (const bad of [
    "not a date",
    "n/a",
    null,
    undefined,
    false,
    NaN,
    new Date(NaN),
  ])
    assert.strictEqual(
      parseTime(bad),
      undefined,
      `${String(bad)} does not parse`,
    );
});

it("parseTimeValues keeps only the values that parse", () => {
  const out = parseTimeValues([
    "2024-01-01",
    "nope",
    null,
    +new Date(2024, 6, 1),
  ]);
  assert.deepStrictEqual(out.map(Number), [
    +new Date(2024, 0, 1),
    +new Date(2024, 6, 1),
  ]);
  assert.ok(out.every(d => d instanceof Date));
});

it("axisScaleData parses on a time scale only", () => {
  const strings = ["2024-01-01", "bad"];
  const time = {schema: {scale: "time"}, _data: strings};
  assert.deepStrictEqual(axisScaleData(time).map(Number), [
    +new Date(2024, 0, 1),
  ]);
  const linear = {schema: {scale: "linear"}, _data: strings};
  assert.strictEqual(axisScaleData(linear), strings);
  assert.deepStrictEqual(
    axisScaleData({schema: {scale: "time"}, _data: undefined}),
    [],
  );
});

it("axisTimeDomain parses the domain, falling back to the data's extent", () => {
  const data = [
    new Date(2024, 0, 1),
    new Date(2024, 6, 1),
    new Date(2024, 3, 1),
  ];
  const parsed = axisTimeDomain({
    schema: {domain: ["2023-01-01", "2025-01-01"]},
    _scaleData: data,
  });
  assert.deepStrictEqual(parsed.map(Number), [
    +new Date(2023, 0, 1),
    +new Date(2025, 0, 1),
  ]);
  const fallback = axisTimeDomain({
    schema: {domain: ["nope", "2025-01-01"]},
    _scaleData: data,
  });
  assert.deepStrictEqual(fallback.map(Number), [+data[0], +data[1]]);
  const noData = axisTimeDomain({
    schema: {domain: ["nope", "2025-01-01"]},
    _scaleData: [],
  });
  assert.deepStrictEqual(
    noData.map(d => d && +d),
    [undefined, +new Date(2025, 0, 1)],
  );
});
