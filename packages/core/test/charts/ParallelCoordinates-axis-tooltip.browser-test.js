import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover, label, nodePoint, tooltip} from "./axis-tooltip-page.js";

/**
    Axis tooltips on a ParallelCoordinates, with the real pointer on SVG and
    Canvas: a dimension's `tickTooltip` and `titleTooltip` (from `axisConfig`
    or its `dimensionConfig` entry) show the chart's tooltip over its tick
    labels and title, a label drawn cut short shows its whole text, and every
    other part of an axis lets the pointer through, so the lines still hover
    and the strips still brush.
*/

const LONG =
  "A rather long category name that will not fit in the room it is given here, not even when it wraps onto several lines of text, because it just goes on and on and on and on and on and on and on and on and on";
const LONG_TITLE =
  "A very long dimension title that will be cut short for sure";

/**
    A ParallelCoordinates source (`lib => viz`) with `extra` config. The
    lines run level between the `x` and `w` axes, so row `r4`'s passes under
    `w`'s label for 4.
*/
const parallel = (extra = "") => `lib => new lib.ParallelCoordinates().config({
  data: Array.from({length: 12}, (_, i) => ({
    id: "r" + i,
    group: ["A", "B"][i % 2],
    kind: i % 3 ? "Short" : ${JSON.stringify(LONG)},
    x: i,
    w: i,
    z: 11 - i,
  })),
  groupBy: ["group", "id"],
  dimensions: ["kind", "x", "w", "z"],
  legend: false,
  axisConfig: {titleConfig: {maxLines: 1}},
  dimensionConfig: {
    x: {
      labels: [0, 4, 8],
      title: "Horsepower",
      titleTooltip: "Gross, in hp",
      tickTooltip: (value, index) => "x " + value + " #" + index,
    },
    w: {
      labels: [0, 2, 4, 6, 8, 10],
      title: ${JSON.stringify(LONG_TITLE)},
      tickTooltip: value => (value === 6 ? false : "w " + value),
    },
    z: {title: "Zed", titleTooltip: () => false},
  },
  ${extra}
}).on("click.shape", d => (window.__clicks ||= []).push(d.id))`;

/** The matcher for dimension `key`'s tick label, with a tooltip, drawing `text`. */
const tick = (key, text) =>
  `(node, drawn) => !!node.axisTooltip && node.axisTooltip.part === "tick" && drawn === ${JSON.stringify(text)} && node.axisTooltip.option === window.__viz.dimensionConfig()[${JSON.stringify(key)}].tickTooltip`;

/** The matcher for the title, with a tooltip, whose whole text is `text`. */
const titled = text =>
  `node => !!node.axisTooltip && node.axisTooltip.part === "title" && node.axisTooltip.text === ${JSON.stringify(text)}`;

/** The matcher for a label drawn cut short, on an axis with no tooltip option. */
const cutTick = `node => !!node.axisTooltip && node.axisTooltip.part === "tick" && node.axisTooltip.truncated`;

/** The tooltip's title and body, or `null` when none shows. */
const text = async page => {
  const tip = await tooltip(page);
  return tip && {title: tip.title, body: tip.body};
};

/** The client point of the first node matching `match`. */
async function point(page, match) {
  const at = await nodePoint(page, match);
  assert.ok(at, `a node matches ${match}`);
  return at;
}

/** Hovers the first node matching `match` and returns the tooltip's text. */
async function over(page, match) {
  await hover(page, await point(page, match));
  return text(page);
}

/** The rows `click.shape` has reported. */
const clicks = page => page.evaluate(() => window.__clicks ?? []);

/** The chart's brushes, by dimension. */
const brushes = page => page.evaluate(() => window.__viz.brushes());

/** Dimension `key`'s brush strip, as `[left, top, width, height]` in client pixels. */
const strip = (page, key) =>
  page.evaluate(key => {
    const g = [
      ...document.querySelectorAll("#viz g.d3plus-parallel-brush"),
    ].find(g => g.__data__.key === key);
    const box = g.querySelector("rect.overlay").getBoundingClientRect();
    return [box.left, box.top, box.width, box.height];
  }, key);

/** A point on row `r4`'s line, halfway between the `x` and `w` axes. */
async function onLine(page) {
  const [from, to] = [
    await point(page, tick("x", "4")),
    await point(page, tick("w", "4")),
  ];
  return [(from[0] + to[0]) / 2, to[1]];
}

/** Runs `run(page)` on a chart built from `src`, 700 by 400. */
async function withChart(src, renderer, run) {
  const {page, errors, close} = await chart(src, renderer, [700, 400]);
  try {
    await run(page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  const name = `ParallelCoordinates axis tooltip (${renderer})`;

  it(`${name}: a dimension's tickTooltip and titleTooltip show over its labels`, () =>
    withChart(parallel(), renderer, async page => {
      assert.deepStrictEqual(await over(page, tick("x", "4")), {
        title: "",
        body: "x 4 #1",
      });
      assert.deepStrictEqual(
        await over(page, tick("x", "0")),
        {title: "", body: "x 0 #0"},
        "the index counts from the lowest value, drawn at the bottom",
      );
      assert.deepStrictEqual(await over(page, titled("Horsepower")), {
        title: "",
        body: "Gross, in hp",
      });
      assert.deepStrictEqual(await clicks(page), []);

      // Right under either rule for a group's `interactive: false`: no label
      // with a tooltip sits inside an inert group.
      const stamped = await page.evaluate(() => {
        const found = [];
        const walk = (node, inert) => {
          if (node.axisTooltip) found.push(inert || node.interactive === false);
          (node.children || []).forEach(child =>
            walk(child, inert || node.interactive === false),
          );
        };
        walk(window.__viz._paintedScene.root, false);
        return found;
      });
      assert.ok(stamped.length > 0, "labels are stamped");
      assert.ok(
        stamped.every(inert => !inert),
        "none is inert",
      );
    }));

  it(`${name}: axisConfig gives every dimension the option`, () =>
    withChart(
      parallel(
        `axisConfig: {titleConfig: {maxLines: 1}, tickTooltip: value => "tick " + value, titleTooltip: title => "About " + title}`,
      ),
      renderer,
      async page => {
        assert.deepStrictEqual(await over(page, label("Short")), {
          title: "",
          body: "tick Short",
        });
        assert.deepStrictEqual(await over(page, titled("kind")), {
          title: "",
          body: "About kind",
        });
        assert.deepStrictEqual(
          await over(page, tick("x", "4")),
          {title: "", body: "x 4 #1"},
          "a dimension's own option comes first",
        );
      },
    ));

  it(`${name}: a function returning false hides the tooltip`, () =>
    withChart(parallel(), renderer, async page => {
      assert.deepStrictEqual(await over(page, tick("w", "8")), {
        title: "",
        body: "w 8",
      });
      assert.strictEqual(await over(page, tick("w", "6")), null, "a tick");
      assert.strictEqual(await over(page, label("Zed")), null, "a title");
    }));

  it(`${name}: a label drawn cut short shows its whole text`, () =>
    withChart(parallel(), renderer, async page => {
      assert.deepStrictEqual(await over(page, cutTick), {
        title: LONG,
        body: "",
      });
      assert.deepStrictEqual(await over(page, titled(LONG_TITLE)), {
        title: LONG_TITLE,
        body: "",
      });
    }));

  it(`${name}: tickTooltip and titleTooltip false keep a cut label quiet`, () =>
    withChart(
      parallel(
        `axisConfig: {titleConfig: {maxLines: 1}, tickTooltip: false, titleTooltip: false}`,
      ),
      renderer,
      async page => {
        assert.strictEqual(await over(page, label(LONG.slice(0, 8))), null);
        assert.strictEqual(
          await over(page, label(LONG_TITLE.slice(0, 8))),
          null,
        );
      },
    ));

  it(`${name}: a plain label shows nothing and is never clicked`, () =>
    withChart(parallel(), renderer, async page => {
      // No line runs under the first axis's labels, or the titles.
      for (const plain of ["Short", "kind", "Zed"]) {
        const at = await point(page, label(plain));
        await hover(page, at);
        assert.strictEqual(await tooltip(page), null, plain);
        await page.mouse.click(at[0], at[1]);
        await page.waitForTimeout(120);
        assert.strictEqual(await tooltip(page), null, `${plain}, clicked`);
      }
      assert.deepStrictEqual(await clicks(page), [], "no label is clicked");

      const at = await point(page, tick("x", "4"));
      await hover(page, at);
      await page.mouse.click(at[0], at[1]);
      await page.waitForTimeout(120);
      assert.deepStrictEqual(await clicks(page), [], "nor one with a tooltip");
    }));

  it(`${name}: a line hovers and clicks as before, and wins over a label it is raised across`, () =>
    withChart(parallel(), renderer, async page => {
      const line = await onLine(page);
      await hover(page, line);
      assert.strictEqual((await tooltip(page))?.title, "r4", "the line's");
      await page.mouse.click(line[0], line[1]);
      await page.waitForTimeout(120);
      assert.deepStrictEqual(await clicks(page), ["r4"]);

      // Along the hovered line, onto the label it runs under: the hovered
      // line paints over the axes, so it keeps the pointer.
      const at = await point(page, tick("w", "4"));
      await page.mouse.move(at[0], at[1], {steps: 8});
      await page.waitForTimeout(120);
      assert.strictEqual((await tooltip(page))?.title, "r4", "on the label");
      await page.mouse.click(at[0], at[1]);
      await page.waitForTimeout(120);
      assert.deepStrictEqual(await clicks(page), ["r4", "r4"], "the line's");

      // A label clear of the hovered line shows its own tooltip.
      assert.deepStrictEqual(await over(page, tick("w", "8")), {
        title: "",
        body: "w 8",
      });
      await page.mouse.click(...(await point(page, tick("w", "8"))));
      await page.waitForTimeout(120);
      assert.deepStrictEqual(await clicks(page), ["r4", "r4"], "no row");

      await page.mouse.move(line[0], line[1], {steps: 8});
      await page.waitForTimeout(120);
      assert.strictEqual((await tooltip(page))?.title, "r4", "back on it");
    }));

  it(`${name}: a brush dragged across a label brushes, with no tooltip until it ends`, () =>
    withChart(parallel(), renderer, async page => {
      const [left, top, width, height] = await strip(page, "w");
      const at = await point(page, tick("w", "4"));
      assert.ok(at[0] < left, "the label sits beside the strip");

      assert.deepStrictEqual(await over(page, tick("w", "4")), {
        title: "",
        body: "w 4",
      });
      await page.mouse.move(left + width / 2, top + height * 0.2, {steps: 4});
      await page.waitForTimeout(120);
      assert.strictEqual(await tooltip(page), null, "on the strip");

      await page.mouse.down();
      await page.mouse.move(at[0], at[1], {steps: 6});
      await page.waitForTimeout(150);
      assert.strictEqual(await tooltip(page), null, "mid-drag, on the label");
      await page.mouse.up();
      await page.waitForTimeout(150);
      const brushed = await brushes(page);
      assert.deepStrictEqual(Object.keys(brushed), ["w"]);
      assert.ok(brushed.w[0] < brushed.w[1], "a range is brushed");
      assert.strictEqual(await tooltip(page), null, "released");

      await hover(page, await point(page, tick("w", "4")));
      assert.deepStrictEqual(
        await text(page),
        {title: "", body: "w 4"},
        "with no button down, the label hovers again",
      );
    }));

  it(`${name}: a press on a label beside its strip starts no brush`, () =>
    withChart(parallel(), renderer, async page => {
      const at = await point(page, tick("w", "4"));
      await hover(page, at);
      await page.mouse.down();
      await page.mouse.move(at[0], at[1] + 60, {steps: 5});
      await page.mouse.up();
      await page.waitForTimeout(150);
      assert.deepStrictEqual(await brushes(page), {});
    }));

  it(`${name}: a strip wide enough to cover a label takes the pointer there`, () =>
    withChart(parallel(`brushConfig: {width: 80}`), renderer, async page => {
      const [left] = await strip(page, "w");
      const at = await point(page, tick("w", "4"));
      assert.ok(at[0] > left, "the label is under the strip");
      await hover(page, at);
      assert.strictEqual(await tooltip(page), null, "no tooltip");
      await page.mouse.down();
      await page.mouse.move(at[0], at[1] + 60, {steps: 5});
      await page.mouse.up();
      await page.waitForTimeout(150);
      const brushed = await brushes(page);
      assert.deepStrictEqual(Object.keys(brushed), ["w"], "the drag brushes");
    }));

  it(`${name}: stacked axes show their labels' tooltips`, () =>
    withChart(parallel(`orient: "vertical"`), renderer, async page => {
      assert.deepStrictEqual(await over(page, tick("x", "4")), {
        title: "",
        body: "x 4 #1",
      });
      assert.deepStrictEqual(await over(page, titled("Horsepower")), {
        title: "",
        body: "Gross, in hp",
      });
      // A line runs under each of these labels, but none is hovered.
      const at = await point(page, tick("w", "4"));
      await page.mouse.move(at[0], at[1] - 40, {steps: 3});
      await page.mouse.move(at[0], at[1], {steps: 8});
      await page.waitForTimeout(120);
      assert.deepStrictEqual(await text(page), {title: "", body: "w 4"});
      await page.mouse.click(at[0], at[1]);
      await page.waitForTimeout(120);
      assert.deepStrictEqual(await clicks(page), []);
    }));

  it(`${name}: each small multiple's labels show their tooltips`, () =>
    withChart(parallel(`facet: "group"`), renderer, async page => {
      const points = await page.evaluate(() => {
        const found = [];
        const walk = node => {
          if (
            node.type === "text" &&
            node.axisTooltip?.part === "tick" &&
            node.axisTooltip.value === 4 &&
            typeof node.axisTooltip.option === "function" &&
            node.axisTooltip.option(4, 1) === "x 4 #1"
          )
            found.push(node.key);
          (node.children || []).forEach(walk);
        };
        walk(window.__viz._paintedScene.root);
        return found;
      });
      assert.strictEqual(points.length, 2, "one in each panel");
      for (const key of points)
        assert.deepStrictEqual(
          await over(page, `node => node.key === ${JSON.stringify(key)}`),
          {title: "", body: "x 4 #1"},
          key,
        );
    }));
}
