import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import RESET from "../../src/utils/RESET.ts";

/**
    A chart's `colorScaleConfig`, in a real browser on both renderers:

    - its `width` (a scale at the left or right) or `height` (top or bottom)
      is the most of the chart the scale takes, in place of a third, with the
      scale drawn against its edge of the chart in the margin it claims; at
      the top or bottom, a `width` is the scale's length.
    - each render starts from the config the chart has then, so config set
      and then reset doesn't carry over.
    - a title over swatches wraps within the scale's third and is left out
      before the swatches' labels when they don't fit together.
*/

const rows = Array.from({length: 30}, (_, i) => ({
  id: `n${i}`,
  v: (((i + 1) * 137) % 1000) + i,
}));
const prefix = "A very long color scale label for ";

const scales = {
  gradient: {scale: "linear"},
  "bucketed bar": {scale: "jenks", bucketAxis: true},
  swatches: {scale: "jenks"},
};

/**
    Draws the chart into `#${arg.target}` and reports its painted colorScale;
    with `arg.then`, merges that into its colorScaleConfig and draws it again,
    reporting the second draw.
*/
const draw = arg =>
  new Promise(resolve => {
    const {prefix, title} = arg;
    const viz = new window.d3plus.Treemap()
      .data(arg.rows)
      .groupBy("id")
      .sum("v")
      .colorScale("v")
      .colorScalePosition(arg.position)
      // Through config(), which notes the defaults RESET restores first.
      .config({
        colorScaleConfig: {
          ...arg.config,
          axisConfig: {
            ...(prefix ? {tickFormat: d => `${prefix}${d}`} : {}),
            ...(title ? {title} : {}),
          },
        },
      })
      .renderer(arg.renderer)
      .duration(0)
      .select(`#${arg.target}`);
    const report = () => {
      // `box` is the extent of the scale's bar or swatches in the chart.
      const out = {labels: [], rects: 0, box: null};
      const walk = (n, dx, dy) => {
        const x = dx + ((n.transform && n.transform.x) || 0);
        const y = dy + ((n.transform && n.transform.y) || 0);
        if (n.type === "text")
          out.labels.push(n.lines.map(l => l.text).join(" "));
        else if (n.type === "rect") {
          out.rects++;
          const [x0, y0, x1, y1] = out.box || [x + n.x, y + n.y, x, y];
          out.box = [
            Math.min(x0, x + n.x),
            Math.min(y0, y + n.y),
            Math.max(x1, x + n.x + n.width),
            Math.max(y1, y + n.y + n.height),
          ];
        }
        (n.children || []).forEach(c => walk(c, x, y));
      };
      const scale = viz._paintedScene.root.children.find(
        n => n.key === "viz-colorScale",
      );
      if (scale) walk(scale, 0, 0);
      return {...out, margin: viz._margin};
    };
    viz.render(() => {
      if (!arg.then) return resolve(report());
      viz.colorScaleConfig(arg.then).render(() => resolve(report()));
    });
  });

/** Draws `arg` once per entry of `arg.variants`, each with that entry's changes. */
const drawEach = new Function(
  "arg",
  `const draw = ${draw};
  return arg.variants.reduce(
    (done, variant, i) =>
      done.then(out =>
        draw({...arg, ...variant, target: "v" + i}).then(d => [...out, d]),
      ),
    Promise.resolve([]),
  );`,
);

/** Draws one chart per variant, `size` wide and tall. */
const drawVariants = (arg, variants, [w, h] = [600, 400]) =>
  render(
    variants
      .map(
        (_, i) => `<div id='v${i}' style='width:${w}px;height:${h}px'></div>`,
      )
      .join(""),
    drawEach,
    {rows, ...arg, variants},
  );

/** Whether a scale at `position` runs along the chart's width. */
const wide = position => position === "top" || position === "bottom";

/** Asserts the scale's bar or swatches lie in the margin it claims at `position`. */
const assertInMargin = ({box, margin}, position, [w, h] = [600, 400]) => {
  const claim = margin[position];
  const [from, to] = wide(position) ? [box[1], box[3]] : [box[0], box[2]];
  const side = wide(position) ? h : w;
  const [min, max] =
    position === "top" || position === "left"
      ? [0, claim]
      : [side - claim, side];
  assert.ok(
    from >= min && to <= max,
    `drawn against the chart's ${position} edge (${from} to ${to} in ${min} to ${max})`,
  );
};

/** The `colorScaleConfig` size across a scale at `position`. */
const acrossKey = position => (wide(position) ? "height" : "width");

for (const renderer of ["svg", "canvas"])
  for (const name of ["gradient", "bucketed bar"])
    for (const position of ["top", "bottom", "left", "right"])
      it(`[${renderer}] colorScaleConfig.${acrossKey(position)} limits a ${name} colorScale at the ${position}`, async () => {
        const set = wide(position) ? 60 : 90;
        const [limited] = await drawVariants({renderer, position, prefix}, [
          {config: {...scales[name], [acrossKey(position)]: set}},
        ]);
        assert.ok(
          limited.rects >= 1,
          `its colors are drawn (${limited.rects})`,
        );
        assert.ok(
          limited.margin[position] > 0 && limited.margin[position] <= set,
          `the scale takes at most ${set}px (${limited.margin[position]})`,
        );
        assertInMargin(limited, position);
      });

for (const renderer of ["svg", "canvas"])
  for (const position of ["bottom", "right"])
    it(`[${renderer}] colorScaleConfig.${acrossKey(position)} keeps a swatches colorScale against the ${position} edge`, async () => {
      const set = wide(position) ? 50 : 120;
      const [limited, plain] = await drawVariants({renderer, position}, [
        {config: {...scales.swatches, [acrossKey(position)]: set}},
        {config: scales.swatches},
      ]);
      assert.deepStrictEqual(limited.labels, plain.labels, "labeled");
      assert.ok(
        limited.margin[position] <= set,
        `the scale takes at most ${set}px (${limited.margin[position]})`,
      );
      assertInMargin(limited, position);
    });

for (const renderer of ["svg", "canvas"])
  for (const [name, scale] of Object.entries(scales))
    for (const position of ["top", "bottom"])
      it(`[${renderer}] colorScaleConfig.width is the length of a ${name} colorScale at the ${position}`, async () => {
        const [limited] = await drawVariants({renderer, position}, [
          {config: {...scale, width: 300}},
        ]);
        // Centered in the chart's 600px width, as a scale of that length is.
        const [x0, , x1] = limited.box;
        assert.ok(
          x0 >= 150 && x1 <= 450,
          `drawn within 150 to 450 (${x0} to ${x1})`,
        );
      });

/** What a draw shows: its labels, where its colors are, and the margin. */
const shown = ({labels, box, margin}) => ({labels, box, margin});

for (const renderer of ["svg", "canvas"])
  it(`[${renderer}] a legendConfig.width reset no longer limits a swatches colorScale`, async () => {
    const arg = {renderer, position: "right"};
    const [reset, fresh] = await drawVariants(arg, [
      {
        config: {...scales.swatches, legendConfig: {width: 60}},
        then: {legendConfig: {width: RESET}},
      },
      {config: scales.swatches},
    ]);
    assert.ok(fresh.labels.length > 0, "the fresh scale is labeled");
    assert.deepStrictEqual(shown(reset), shown(fresh), "as if never set");
  });

for (const renderer of ["svg", "canvas"])
  it(`[${renderer}] a colorScaleConfig.bucketAxis reset draws swatches again`, async () => {
    const arg = {renderer, position: "right"};
    const [reset, fresh] = await drawVariants(arg, [
      {config: scales["bucketed bar"], then: {bucketAxis: RESET}},
      {config: scales.swatches},
    ]);
    assert.deepStrictEqual(shown(reset), shown(fresh), "as if never set");
  });

for (const renderer of ["svg", "canvas"])
  for (const position of ["bottom", "right"])
    it(`[${renderer}] swatches whose long labels are reset draw as a fresh chart's at the ${position}`, async () => {
      const size = [250, 200];
      const arg = {renderer, position, config: scales.swatches};
      const [limited, after, fresh] = await drawVariants(
        arg,
        [{prefix}, {prefix, then: {axisConfig: {tickFormat: RESET}}}, {}],
        size,
      );
      assert.ok(
        limited.labels.every(l => !l.startsWith(prefix)),
        "long labels are left out at first",
      );
      assert.ok(fresh.labels.length > 0, "the fresh scale is labeled");
      assert.deepStrictEqual(shown(after), shown(fresh), "as a fresh chart");
    });

const title = "Median income";

for (const renderer of ["svg", "canvas"])
  for (const position of ["left", "right"])
    it(`[${renderer}] a title wraps within a swatches colorScale's third at the ${position}`, async () => {
      const size = [250, 400];
      const [titled] = await drawVariants(
        {renderer, position, title, config: scales.swatches},
        [{}],
        size,
      );
      assert.ok(
        titled.labels.includes(title),
        `the title is drawn (${titled.labels.join(" | ")})`,
      );
      assert.ok(
        titled.margin[position] <= size[0] / 3,
        `the scale takes at most a third (${titled.margin[position]})`,
      );
      assertInMargin(titled, position, size);
    });

for (const renderer of ["svg", "canvas"])
  for (const position of ["left", "right"])
    it(`[${renderer}] a title is left out before the labels of a swatches colorScale at the ${position} of a small chart`, async () => {
      const size = [250, 200];
      const arg = {renderer, position, config: scales.swatches};
      const [titled, plain] = await drawVariants(arg, [{title}, {}], size);
      assert.ok(
        !titled.labels.includes(title),
        `the title is left out (${titled.labels.join(" | ")})`,
      );
      assert.deepStrictEqual(titled.labels, plain.labels, "every label drawn");
      assert.ok(
        titled.margin[position] <= size[0] / 3,
        `the scale takes at most a third (${titled.margin[position]})`,
      );
      assertInMargin(titled, position, size);
    });

for (const renderer of ["svg", "canvas"])
  for (const position of ["top", "bottom"])
    it(`[${renderer}] a title is left out before the labels of a swatches colorScale at the ${position} of a short chart`, async () => {
      const size = [600, 105];
      const arg = {renderer, position, config: scales.swatches};
      const [titled, plain] = await drawVariants(arg, [{title}, {}], size);
      assert.ok(plain.labels.length > 0, "with no title, labeled");
      assert.deepStrictEqual(shown(titled), shown(plain), "as with no title");
    });
