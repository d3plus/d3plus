import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {
  bar,
  chart,
  gridLine,
  hover,
  label,
  nodePoint,
  shape,
  task,
  tickLabel,
  title,
  tooltip,
} from "./axis-tooltip-page.js";

/**
    #441 / #167: an axis's `titleTooltip` and `tickTooltip` show the chart's
    tooltip when the real pointer rests on the axis's title or a tick label,
    on both backends; a label drawn cut short shows its whole text by default.
*/

const LONG = "A rather long category name that will not fit";
const OTHER_LONG = "Another long category name that is cut short as well";
const LONG_TITLE =
  "A very long y axis title that goes on and on and on and on and on and on and on and on and on and on and on";

const data = `[
  {id: "alpha", x: ${JSON.stringify(LONG)}, y: 4},
  {id: "beta", x: "Bee", y: 6},
  {id: "gamma", x: "Sea", y: 2},
]`;

/** A BarChart source (`lib => viz`) with `extra` config. */
const bars = (extra = "") => `lib => new lib.BarChart().config({
  data: ${data}, groupBy: "id", x: "x", y: "y", legend: false, ${extra}
})`;

// Draws the long category cut short, and the long title on one cut line.
const cut = `xConfig: {maxSize: 40, labelRotation: false, CUTX},
  yConfig: {title: ${JSON.stringify(LONG_TITLE)}, titleConfig: {maxLines: 1}, CUTY}`;
const cutBars = (x = "", y = "") =>
  bars(cut.replace("CUTX", x).replace("CUTY", y));

const LONG_TICK =
  "The long week that begins on the eighteenth day of March in the year 2024, a Monday, and ends on a Sunday, with the design review on its Wednesday afternoon and the sprint demo on its Friday morning";
const MARCH_18 = "new Date(2024, 2, 18)";

/** A Gantt source (`lib => viz`) labeling three weeks, with `axis` config. */
const gantt = (axis = "") => `lib => new lib.Gantt().config({
  data: [
    {task: "Plan", start: "2024-03-04", end: "2024-03-08"},
    {task: "Design", start: "2024-03-11", end: "2024-03-22"},
    {task: "Ship", start: "2024-03-25", end: "2024-04-05"},
  ],
  groupBy: "task", legend: false,
  axisConfig: {
    labels: [new Date(2024, 2, 4), ${MARCH_18}, new Date(2024, 3, 1)],
    tickFormat: d => new Date(d).toDateString().slice(4, 10),
    ${axis}
  },
})`;

/** Just the tooltip's text. */
const text = async page => {
  const tip = await tooltip(page);
  return tip && {title: tip.title, body: tip.body, rows: tip.rows};
};

/** Hovers the first node matching `match` and returns the tooltip's text. */
async function over(page, match) {
  const point = await nodePoint(page, match);
  assert.ok(point, `a node matches ${match}`);
  await hover(page, point);
  return text(page);
}

/** Moves the pointer off the chart. */
async function leave(page) {
  await page.mouse.move(700, 500, {steps: 3});
  await page.waitForTimeout(120);
}

/**
    The cursor under `point`: the computed cursor of the element there, a
    shape inside the chart's svg or, with the Canvas renderer, its canvas.
*/
const cursor = (page, point) =>
  page.evaluate(
    ([x, y]) => getComputedStyle(document.elementFromPoint(x, y)).cursor,
    point,
  );

/** `src` with a `click.shape` handler recording each clicked row's `field`. */
const clickable = (src, field) =>
  `${src}.on("click.shape", d => (window.__clicks ||= []).push(d[${JSON.stringify(field)}]))`;

/** What `clickable`'s handler has recorded. */
const clicks = page => page.evaluate(() => window.__clicks ?? []);

/**
    Asserts the shape matching `match` takes the pointer (a tooltip, the
    pointer cursor, and one `click.shape` reporting `id`), then that each label
    in `names` is chrome: no tooltip and no pointer cursor under the pointer,
    and no `click.shape` from a click on it.
*/
async function assertChrome(page, match, id, names) {
  const mark = await nodePoint(page, match);
  assert.ok(mark, "the shape is drawn");
  await hover(page, mark);
  assert.ok(await tooltip(page), "the shape shows its tooltip");
  assert.strictEqual(await cursor(page, mark), "pointer", "the shape's cursor");
  await page.mouse.click(mark[0], mark[1]);
  await page.waitForTimeout(120);
  assert.deepStrictEqual(await clicks(page), [id]);

  for (const name of names) {
    const at = await nodePoint(page, label(name));
    assert.ok(at, `${name} is drawn`);
    await hover(page, mark);
    await hover(page, at);
    assert.strictEqual(await tooltip(page), null, name);
    assert.strictEqual(await cursor(page, at), "auto", `${name}, cursor`);
    await page.mouse.click(at[0], at[1]);
    await page.waitForTimeout(120);
    assert.strictEqual(await tooltip(page), null, `${name}, clicked`);
  }
  assert.deepStrictEqual(await clicks(page), [id], "no label is clicked");
}

/** Runs `run(page)` on a chart built from `src`. */
async function withChart(src, renderer, run) {
  const {page, errors, close} = await chart(src, renderer);
  try {
    await run(page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`axis tooltip (${renderer}): a title's string is the tooltip's text`, () =>
    withChart(
      bars(
        `xConfig: {title: "GDP per capita", titleTooltip: "Constant 2015 US$"}, yConfig: {title: "Life"}`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, title), {
          title: "",
          body: "Constant 2015 US$",
          rows: [],
        });
        // The axis's ticks and the other axis's title have none.
        assert.strictEqual(await over(page, label("Bee")), null);
        assert.strictEqual(await over(page, label("Life")), null);
      },
    ));

  it(`axis tooltip (${renderer}): a title's function receives the title`, () =>
    withChart(
      bars(
        `yConfig: {title: "Life expectancy", titleTooltip: function (title) { window.__args = Array.from(arguments); window.__self = this === window.__viz; return "About " + title.toLowerCase(); }}`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, title), {
          title: "",
          body: "About life expectancy",
          rows: [],
        });
        assert.deepStrictEqual(
          await page.evaluate(() => [window.__args, window.__self]),
          [["Life expectancy"], true],
        );
      },
    ));

  it(`axis tooltip (${renderer}): a title's tooltip config lays over the chart's tooltipConfig`, () =>
    withChart(
      bars(
        `tooltipConfig: {background: "rgb(0, 0, 128)", footer: "chart footer"},
         xConfig: {title: "GDP", titleTooltip: {
           title: t => t + " per capita",
           body: t => "About " + t,
           tbody: [["Unit", t => "US$ (" + t + ")"]]
         }},
         yConfig: {title: "Life", titleTooltip: {background: "rgb(128, 0, 0)", body: "Years"}}`,
      ),
      renderer,
      async page => {
        await hover(page, await nodePoint(page, label("GDP")));
        assert.deepStrictEqual(await tooltip(page), {
          title: "GDP per capita",
          body: "About GDP",
          rows: [["Unit", "US$ (GDP)"]],
          background: "rgb(0, 0, 128)",
        });
        await hover(page, await nodePoint(page, label("Life")));
        assert.deepStrictEqual(await tooltip(page), {
          title: "",
          body: "Years",
          rows: [],
          background: "rgb(128, 0, 0)",
        });
      },
    ));

  it(`axis tooltip (${renderer}): a tick's function receives its value and index`, () =>
    withChart(
      bars(
        `xConfig: {tickTooltip: function (value, index) { (window.__calls = window.__calls || []).push([value, index, this === window.__viz]); return value === "Bee" ? "The second letter" : undefined; }},
         yConfig: {tickTooltip: (value, index) => value === 4 ? "Four, tick " + index : ""}`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, label("Bee")), {
          title: "",
          body: "The second letter",
          rows: [],
        });
        // A tick the function returns nothing for shows no tooltip.
        assert.strictEqual(await over(page, label("Sea")), null);
        const calls = await page.evaluate(() => window.__calls);
        assert.deepStrictEqual(calls.at(0), ["Bee", 1, true]);
        assert.deepStrictEqual(calls.at(-1), ["Sea", 2, true]);
        // A value axis's ticks are numbers, counted up from its lowest.
        assert.deepStrictEqual(await over(page, label("4")), {
          title: "",
          body: "Four, tick 4",
          rows: [],
        });
        assert.strictEqual(await over(page, label("5")), null);
      },
    ));

  it(`axis tooltip (${renderer}): a tick's tooltip config receives the tick`, () =>
    withChart(
      bars(
        `xConfig: {tickTooltip: {
           title: value => "Category " + value,
           tbody: [["Index", (value, index) => index]]
         }}`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, label("Sea")), {
          title: "Category Sea",
          body: "",
          rows: [["Index", "2"]],
        });
        assert.deepStrictEqual(await over(page, label("Bee")), {
          title: "Category Bee",
          body: "",
          rows: [["Index", "1"]],
        });
      },
    ));

  it(`axis tooltip (${renderer}): a tick's string shows on every tick`, () =>
    withChart(
      bars(`xConfig: {tickTooltip: "A letter"}`),
      renderer,
      async page => {
        for (const letter of ["Bee", "Sea"])
          assert.deepStrictEqual(await over(page, label(letter)), {
            title: "",
            body: "A letter",
            rows: [],
          });
        assert.strictEqual(await over(page, label("4")), null);
      },
    ));

  it(`axis tooltip (${renderer}): a y axis counts its ticks from the bottom label`, () =>
    withChart(
      bars(
        `yConfig: {tickTooltip: (value, index) => value + " is tick " + index}`,
      ),
      renderer,
      async page => {
        const [bottom, top] = [
          await nodePoint(page, tickLabel("0")),
          await nodePoint(page, tickLabel("6")),
        ];
        assert.ok(bottom[1] > top[1] + 100, "0 is the bottom label");
        assert.deepStrictEqual(await over(page, tickLabel("0")), {
          title: "",
          body: "0 is tick 0",
          rows: [],
        });
        assert.deepStrictEqual(await over(page, tickLabel("1")), {
          title: "",
          body: "1 is tick 1",
          rows: [],
        });
        assert.deepStrictEqual(await over(page, tickLabel("6")), {
          title: "",
          body: "6 is tick 6",
          rows: [],
        });
      },
    ));

  it(`axis tooltip (${renderer}): a reversed axis keeps each tick's index`, () =>
    withChart(
      bars(
        `xConfig: {reverse: true, tickTooltip: (value, index) => value + " is tick " + index},
         yConfig: {reverse: true, tickTooltip: (value, index) => value + " is tick " + index}`,
      ),
      renderer,
      async page => {
        const [zero, six] = [
          await nodePoint(page, tickLabel("0")),
          await nodePoint(page, tickLabel("6")),
        ];
        assert.ok(zero[1] < six[1] - 100, "0 is the top label");
        assert.deepStrictEqual(await over(page, tickLabel("0")), {
          title: "",
          body: "0 is tick 0",
          rows: [],
        });
        const [bee, sea] = [
          await nodePoint(page, tickLabel("Bee")),
          await nodePoint(page, tickLabel("Sea")),
        ];
        assert.ok(sea[0] < bee[0] - 50, "Sea is drawn before Bee");
        assert.deepStrictEqual(await over(page, tickLabel("Sea")), {
          title: "",
          body: "Sea is tick 2",
          rows: [],
        });
        assert.deepStrictEqual(await over(page, tickLabel("Bee")), {
          title: "",
          body: "Bee is tick 1",
          rows: [],
        });
      },
    ));

  it(`axis tooltip (${renderer}): a function returning false hides a cut label's whole text`, () =>
    withChart(
      `lib => new lib.BarChart().config({
        data: [
          {id: "alpha", x: ${JSON.stringify(LONG)}, y: 4},
          {id: "beta", x: ${JSON.stringify(OTHER_LONG)}, y: 6},
          {id: "gamma", x: "Sea", y: 2},
        ],
        groupBy: "id", x: "x", y: "y", legend: false,
        xConfig: {
          maxSize: 40, labelRotation: false,
          tickTooltip: value => value === ${JSON.stringify(LONG)} ? false : undefined,
        },
        yConfig: {
          title: ${JSON.stringify(LONG_TITLE)}, titleConfig: {maxLines: 1},
          titleTooltip: () => false,
        },
      })`,
      renderer,
      async page => {
        const cutLabel = start =>
          `(node, drawn) => !!node.axisTooltip && node.axisTooltip.truncated && drawn.startsWith(${JSON.stringify(start)})`;
        for (const start of ["A rather", "Another"])
          assert.ok(await nodePoint(page, cutLabel(start)), `${start} is cut`);
        assert.strictEqual(await over(page, cutLabel("A rather")), null);
        // Its neighbor, which the function returns nothing for, keeps its own.
        assert.deepStrictEqual(await over(page, cutLabel("Another")), {
          title: OTHER_LONG,
          body: "",
          rows: [],
        });
        const cutTitle = `node => !!node.axisTooltip && node.axisTooltip.part === "title" && node.axisTooltip.truncated`;
        assert.ok(await nodePoint(page, cutTitle), "the title is cut");
        assert.strictEqual(await over(page, cutTitle), null);
      },
    ));

  it(`axis tooltip (${renderer}): a cut label shows its whole text, a whole label nothing`, () =>
    withChart(cutBars(), renderer, async page => {
      assert.deepStrictEqual(await over(page, label("A rather long")), {
        title: LONG,
        body: "",
        rows: [],
      });
      assert.strictEqual(await over(page, label("Bee")), null);
      assert.strictEqual(await over(page, label("4")), null);
      assert.deepStrictEqual(await over(page, title), {
        title: LONG_TITLE,
        body: "",
        rows: [],
      });
    }));

  it(`axis tooltip (${renderer}): a cut label's whole text heads what its option gives`, () =>
    withChart(
      cutBars(
        `tickTooltip: value => value.length + " letters"`,
        `titleTooltip: "Years"`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, label("A rather long")), {
          title: LONG,
          body: `${LONG.length} letters`,
          rows: [],
        });
        assert.deepStrictEqual(await over(page, label("Bee")), {
          title: "",
          body: "3 letters",
          rows: [],
        });
        assert.deepStrictEqual(await over(page, label("A very long")), {
          title: LONG_TITLE,
          body: "Years",
          rows: [],
        });
      },
    ));

  it(`axis tooltip (${renderer}): false turns each off, cut labels included`, () =>
    withChart(
      cutBars(`tickTooltip: false`, `titleTooltip: false`),
      renderer,
      async page => {
        assert.strictEqual(await over(page, label("A rather long")), null);
        assert.strictEqual(await over(page, label("A very long")), null);
        // The bars keep their tooltips.
        assert.strictEqual((await over(page, bar("beta"))).title, "beta");
      },
    ));

  it(`axis tooltip (${renderer}): false on one option leaves the other`, () =>
    withChart(
      cutBars(`titleTooltip: false, title: "Category"`, `tickTooltip: false`),
      renderer,
      async page => {
        assert.strictEqual(await over(page, label("Category")), null);
        assert.strictEqual(
          (await over(page, label("A rather long"))).title,
          LONG,
        );
        assert.strictEqual(
          (await over(page, label("A very long"))).title,
          LONG_TITLE,
        );
      },
    ));

  it(`axis tooltip (${renderer}): moving between a bar and a tick label swaps tooltips`, () =>
    withChart(
      bars(
        `tooltipConfig: {background: "rgb(0, 0, 128)"},
         xConfig: {tickTooltip: {background: "rgb(128, 0, 0)", title: false, body: value => "About " + value}}`,
      ),
      renderer,
      async page => {
        const mark = await nodePoint(page, bar("beta"));
        const tick = await nodePoint(page, label("Bee"));
        await hover(page, mark);
        const first = await tooltip(page);
        assert.strictEqual(first.title, "beta");
        assert.strictEqual(first.background, "rgb(0, 0, 128)");
        assert.ok(first.rows.length, "the bar's tooltip lists its values");

        await hover(page, tick);
        assert.deepStrictEqual(await tooltip(page), {
          title: "",
          body: "About Bee",
          rows: [],
          background: "rgb(128, 0, 0)",
        });

        // The bar's tooltip comes back as it was: nothing of the axis's stays.
        await hover(page, mark);
        assert.deepStrictEqual(await tooltip(page), first);

        await hover(page, tick);
        assert.strictEqual((await tooltip(page)).body, "About Bee");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): nothing is left after the pointer leaves a label`, () =>
    withChart(
      cutBars(`title: "Category", titleTooltip: "The bars"`),
      renderer,
      async page => {
        for (const match of [
          label("Category"),
          label("A rather long"),
          title,
        ]) {
          assert.ok(await over(page, match), "shown");
          await leave(page);
          assert.strictEqual(await tooltip(page), null, "hidden off the chart");
        }
        // Onto a label with no tooltip, and onto the plot, where the nearest
        // bar's tooltip takes over.
        assert.ok(await over(page, label("A rather long")));
        assert.strictEqual(await over(page, label("Sea")), null);
        assert.ok(await over(page, label("A rather long")));
        const gamma = await nodePoint(page, bar("gamma"));
        await hover(page, [gamma[0], gamma[1] - 150]);
        assert.strictEqual((await tooltip(page)).title, "gamma");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a click or tap on a label keeps its tooltip`, () =>
    withChart(
      bars(`xConfig: {tickTooltip: value => "About " + value}`),
      renderer,
      async page => {
        const tick = await nodePoint(page, label("Bee"));
        await hover(page, tick);
        await page.mouse.click(tick[0], tick[1]);
        await page.waitForTimeout(120);
        assert.strictEqual((await tooltip(page)).body, "About Bee");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);

        // A tap: the touch, then the mouse events a browser follows it with.
        await page.evaluate(([x, y]) => {
          const target = document.elementFromPoint(x, y);
          const fire = (Type, type) =>
            target.dispatchEvent(
              new Type(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x,
                clientY: y,
              }),
            );
          fire(UIEvent, "touchstart");
          fire(MouseEvent, "mousemove");
          fire(MouseEvent, "mousedown");
          fire(MouseEvent, "mouseup");
          fire(MouseEvent, "click");
        }, tick);
        await page.waitForTimeout(120);
        assert.strictEqual((await tooltip(page)).body, "About Bee");
        // A touch anywhere else puts it away.
        await page.evaluate(() =>
          document.body.dispatchEvent(
            new UIEvent("touchstart", {bubbles: true, view: window}),
          ),
        );
        await page.waitForTimeout(120);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a chart with tooltips off shows only what an axis option gives`, () =>
    withChart(
      cutBars(`title: "Category", titleTooltip: "The bars"`).replace(
        "legend: false,",
        "legend: false, tooltip: false,",
      ),
      renderer,
      async page => {
        assert.strictEqual(await over(page, label("A rather long")), null);
        assert.strictEqual(await over(page, label("A very long")), null);
        assert.strictEqual(await over(page, bar("beta")), null);
        assert.deepStrictEqual(await over(page, label("Category")), {
          title: "",
          body: "The bars",
          rows: [],
        });
      },
    ));

  it(`axis tooltip (${renderer}): the second x and y axes`, () =>
    withChart(
      `lib => new lib.LinePlot().config({
        data: [
          {id: "a", x: 1, y: 10, top: 100, right: 5},
          {id: "a", x: 2, y: 20, top: 200, right: 7},
          {id: "a", x: 3, y: 15, top: 300, right: 9},
        ],
        groupBy: "id", x: "x", y: "y", x2: "top", y2: "right", legend: false,
        xConfig: {title: "Bottom", titleTooltip: "x"},
        yConfig: {title: "Left", titleTooltip: "y"},
        x2Config: {title: "Top", titleTooltip: "x2", tickTooltip: value => "top " + value},
        y2Config: {title: "Right", titleTooltip: "y2", tickTooltip: value => "right " + value},
      })`,
      renderer,
      async page => {
        // Each title shows its own axis's text, though all four share a scene key.
        for (const [name, body] of [
          ["Bottom", "x"],
          ["Left", "y"],
          ["Top", "x2"],
          ["Right", "y2"],
        ])
          assert.strictEqual((await over(page, label(name))).body, body, name);
        assert.strictEqual((await over(page, label("200"))).body, "top 200");
        assert.strictEqual((await over(page, label("7"))).body, "right 7");
      },
    ));

  it(`axis tooltip (${renderer}): alongside a shared tooltip and the axis guides`, () =>
    withChart(
      `lib => new lib.LinePlot().config({
        data: [
          {id: "a", x: 1, y: 10}, {id: "a", x: 2, y: 20}, {id: "a", x: 3, y: 15},
          {id: "b", x: 1, y: 12}, {id: "b", x: 2, y: 14}, {id: "b", x: 3, y: 30},
        ],
        groupBy: "id", x: "x", y: "y", legend: false,
        tooltipShared: true, axisHover: true,
        xConfig: {title: "Step", titleTooltip: "Steps taken", tickTooltip: value => "Step " + value},
      })`,
      renderer,
      async page => {
        const shared = async () => {
          const tick = await nodePoint(page, label("2"));
          await hover(page, [tick[0], tick[1] - 150]);
          return tooltip(page);
        };
        const first = await shared();
        assert.ok(
          first && first.rows.length,
          "the shared tooltip shows over the plot",
        );

        assert.strictEqual((await over(page, label("2"))).body, "Step 2");
        assert.strictEqual(
          await page.evaluate(() => !!window.__viz._axisHoverState),
          false,
          "no guides while over a label",
        );
        assert.deepStrictEqual(
          await shared(),
          first,
          "the shared tooltip returns",
        );

        assert.strictEqual((await over(page, title)).body, "Steps taken");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a Matrix's row and column labels`, () =>
    withChart(
      `lib => new lib.Matrix().config({
        data: [
          {id: "a", row: "North", column: "Apples", value: 1},
          {id: "b", row: "North", column: "Pears", value: 2},
          {id: "c", row: "South", column: "Apples", value: 3},
          {id: "d", row: "South", column: "Pears", value: 4},
        ],
        groupBy: ["row", "column"], row: "row", column: "column",
        legend: false, colorScale: "value", colorScalePosition: false,
        rowConfig: {tickTooltip: value => "Region: " + value},
        columnConfig: {tickTooltip: value => "Fruit: " + value},
      })`,
      renderer,
      async page => {
        assert.strictEqual(
          (await over(page, label("South"))).body,
          "Region: South",
        );
        assert.strictEqual(
          (await over(page, label("Pears"))).body,
          "Fruit: Pears",
        );
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a Priestley's time axis`, () =>
    withChart(
      `lib => new lib.Priestley().config({
        data: [
          {id: "a", start: "2004", end: "2007"},
          {id: "b", start: "2005", end: "2010"},
          {id: "c", start: "2008", end: "2012"},
        ],
        groupBy: "id", start: "start", end: "end", legend: false,
        axisConfig: {
          title: "Years",
          titleTooltip: "When each ran",
          tickTooltip: value => "Year " + new Date(value).getFullYear(),
        },
      })`,
      renderer,
      async page => {
        assert.strictEqual(
          (await over(page, label("Years"))).body,
          "When each ran",
        );
        assert.strictEqual((await over(page, label("2008"))).body, "Year 2008");
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a Gantt's time axis`, () =>
    withChart(
      gantt(
        `title: "Schedule", titleTooltip: "When each task runs",
         tickTooltip: value => "Week of " + new Date(value).toDateString()`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, label("Schedule")), {
          title: "",
          body: "When each task runs",
          rows: [],
        });
        assert.deepStrictEqual(await over(page, label("Mar 18")), {
          title: "",
          body: "Week of Mon Mar 18 2024",
          rows: [],
        });
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a Gantt's cut tick label and title show their whole text`, () =>
    withChart(
      gantt(
        `maxSize: 100, labelRotation: true,
         title: ${JSON.stringify(LONG_TITLE)}, titleConfig: {maxLines: 1},
         tickFormat: d => +d === +${MARCH_18} ? ${JSON.stringify(LONG_TICK)} : new Date(d).toDateString().slice(4, 10)`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, label("The long")), {
          title: LONG_TICK,
          body: "",
          rows: [],
        });
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
        assert.strictEqual(await over(page, label("Mar 04")), null);
        assert.deepStrictEqual(await over(page, title), {
          title: LONG_TITLE,
          body: "",
          rows: [],
        });
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));

  it(`axis tooltip (${renderer}): a Gantt's bars keep the pointer under its axis`, () =>
    withChart(
      clickable(gantt(`title: "Schedule"`), "task"),
      renderer,
      async page => {
        const mark = await nodePoint(page, task("Design"));
        const grid = await nodePoint(page, gridLine(MARCH_18));
        assert.ok(mark, "the task's bar is drawn");
        assert.ok(grid, "a grid line is drawn at March 18");
        const [half, spans] = await page.evaluate(() => {
          const scene = window.__viz._chartScene;
          const design = scene.find(n => n.key === "gantt-task-Design");
          const line = scene
            .find(n => n.key === "gantt-axis")
            .children.find(n => n.type === "line");
          const ys = line.points.map(p => p[1]);
          const y = design.transform.y;
          return [design.width / 2, Math.min(...ys) < y && y < Math.max(...ys)];
        });
        assert.ok(Math.abs(grid[0] - mark[0]) < half, "the line is in the bar");
        assert.ok(spans, "the grid lines run through the bar's row");

        const point = [grid[0], mark[1]];
        await hover(page, point);
        assert.strictEqual((await tooltip(page)).title, "Design");
        await leave(page);

        // A label with no tooltip is no shape.
        await assertChrome(page, task("Design"), "Design", [
          "Mar 18",
          "Schedule",
        ]);
      },
    ));

  it(`axis tooltip (${renderer}): a Priestley's plain axis labels are no shapes`, () =>
    withChart(
      clickable(
        `lib => new lib.Priestley().config({
          data: [
            {id: "a", start: "2004", end: "2007"},
            {id: "b", start: "2005", end: "2010"},
            {id: "c", start: "2008", end: "2012"},
          ],
          groupBy: "id", start: "start", end: "end", legend: false,
          axisConfig: {title: "Years"},
        })`,
        "id",
      ),
      renderer,
      page =>
        assertChrome(page, shape("priestley-b-1"), "b", ["2008", "Years"]),
    ));

  it(`axis tooltip (${renderer}): a Matrix's plain axis labels are no shapes`, () =>
    withChart(
      clickable(
        `lib => new lib.Matrix().config({
          data: [
            {id: "a", row: "North", column: "Apples", value: 1},
            {id: "b", row: "North", column: "Pears", value: 2},
            {id: "c", row: "South", column: "Apples", value: 3},
            {id: "d", row: "South", column: "Pears", value: 4},
          ],
          groupBy: ["row", "column"], row: "row", column: "column",
          legend: false, colorScale: "value", colorScalePosition: false,
          rowConfig: {title: "Regions"},
          columnConfig: {title: "Fruits", titleTooltip: "Kinds of fruit"},
        })`,
        "id",
      ),
      renderer,
      async page => {
        await assertChrome(page, shape("matrix-3"), "d", [
          "South",
          "Pears",
          "Regions",
        ]);
        // The other axis's title keeps its tooltip, and is no shape either.
        const at = await nodePoint(page, label("Fruits"));
        await hover(page, at);
        assert.deepStrictEqual(await text(page), {
          title: "",
          body: "Kinds of fruit",
          rows: [],
        });
        await page.mouse.click(at[0], at[1]);
        await page.waitForTimeout(120);
        assert.deepStrictEqual(await clicks(page), ["d"]);
      },
    ));

  it(`axis tooltip (${renderer}): a Pyramid's category labels and side titles are no shapes`, () =>
    withChart(
      clickable(
        `lib => new lib.Pyramid().config({
          data: [
            {age: "0-9", sex: "Women", pop: 10},
            {age: "0-9", sex: "Men", pop: 12},
            {age: "10-19", sex: "Women", pop: 14},
            {age: "10-19", sex: "Men", pop: 11},
          ],
          groupBy: "sex", y: "age", x: "pop", legend: false,
          tooltipShared: false,
        })`,
        "sex",
      ),
      renderer,
      page =>
        assertChrome(page, bar("Women"), "Women", [
          "10-19",
          "0-9",
          "Women",
          "Men",
        ]),
    ));

  it(`axis tooltip (${renderer}): a color scale's plain axis labels are no shapes`, () =>
    withChart(
      clickable(
        `lib => new lib.Treemap().config({
          data: [
            {id: "a", value: 10, score: 0},
            {id: "b", value: 20, score: 50},
            {id: "c", value: 30, score: 100},
          ],
          groupBy: "id", sum: "value", colorScale: "score",
          colorScaleConfig: {scale: "linear", axisConfig: {title: "Score"}},
        })`,
        "id",
      ),
      renderer,
      page => assertChrome(page, shape("treemap-c"), "c", ["40", "Score"]),
    ));

  it(`axis tooltip (${renderer}): a color scale's axis`, () =>
    withChart(
      `lib => new lib.Treemap().config({
        data: [
          {id: "a", value: 10, score: 0},
          {id: "b", value: 20, score: 50},
          {id: "c", value: 30, score: 100},
        ],
        groupBy: "id", sum: "value", colorScale: "score",
        colorScaleConfig: {
          scale: "linear",
          axisConfig: {tickTooltip: value => "Score " + value},
        },
      })`,
      renderer,
      async page => {
        assert.strictEqual(
          (await over(page, tickLabel("50"))).body,
          "Score 50",
        );
        await leave(page);
        assert.strictEqual(await tooltip(page), null);
      },
    ));
}
