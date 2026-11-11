import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Axis labels are measured with the line height they are painted with, so
    a label measured as N lines paints as N lines, in the room measured for
    it. They were measured at textWrap's default line height (17px for 12px
    text) but painted at the label TextBox's (14.4px): a vertical bucketed
    color scale's label, cut to one line by the 17px measure, painted as two
    lines in its box and overlapped its neighbors. Driven in real Chromium
    for text measurement.
*/

const rows = Array.from({length: 30}, (_, i) => ({
  id: `n${i}`,
  v: (((i + 1) * 137) % 1000) + i,
}));

const longLabel =
  "A very long color scale label for the values that are no more than ";

const names = [
  "Agriculture, Forestry, Fishing and Hunting",
  "Professional, Scientific, and Technical Services",
  "Health Care and Social Assistance",
  "Arts, Entertainment, and Recreation",
  "Accommodation and Food Services",
  "Administrative and Support Services",
];

const categories = names.map((id, i) => ({group: "a", id, v: 10 + i}));

/** Chart builders, as sources of `(lib, data, arg) => viz`. */
const charts = {
  colorScale: `(lib, data, [position, scale, prefix]) =>
    new lib.Treemap()
      .data(data)
      .groupBy("id")
      .sum("v")
      .colorScale("v")
      .colorScalePosition(position)
      .colorScaleConfig({
        scale,
        bucketAxis: scale !== "linear",
        axisConfig: {tickFormat: d => prefix + d},
      })`,
  line: `(lib, data, [axis]) =>
    new lib.LinePlot()
      .data(data)
      .groupBy("group")
      .discrete(axis)
      .x(axis === "x" ? "id" : "v")
      .y(axis === "x" ? "v" : "id")
      .legend(false)`,
};

/**
    Renders a chart and reads one of its axes (`"x"`, `"y"`, or
    `"colorScale"`): each painted label's lines, line height, and block,
    beside the label as measured, and each painted label's text block in the
    chart (from the painted scene).
*/
const probe = ([src, data, arg, axisName, width, height, renderer]) =>
  new Promise((resolve, reject) => {
    const el = document.querySelector("#viz");
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    const viz = new Function(
      "lib",
      "data",
      "arg",
      `return (${src})(lib, data, arg);`,
    )(window.d3plus, data, arg);
    viz
      .renderer(renderer)
      .duration(0)
      .select("#viz")
      .render(() => {
        try {
          const axis =
            axisName === "colorScale"
              ? viz._colorScaleClass._axisClass
              : viz[`_${axisName}Axis`];
          const {textData, tickFormat} = window.d3plus.measureAxis(axis);
          const measured = new Map(textData.map(t => [String(t.d), t]));
          const labels = axis._tickShape._labelClass._textData().map(p => {
            const tick = p.data.data;
            const t = measured.get(String(tick.id));
            return {
              text: tickFormat(tick.id),
              painted: {
                lines: p.lines,
                lineHeight: p.lH,
                width: Math.max(...p.widths),
                height: p.lines.length * p.lH,
              },
              measured: t && {
                lines: t.lines,
                lineHeight: t.lineHeight,
                width: t.width,
                // `height` holds the label's padding
                height: t.height - t.fP,
                space: t.space,
                rotate: !!t.rotate,
                truncated: !!t.truncated,
                fits: t.fits,
              },
            };
          });
          // The painted text blocks, in the chart's coordinates: from the first
          // line's ascent to the last line's descent.
          const blocks = [];
          const walk = (node, dx, dy, inAxis) => {
            const t = node.transform || {};
            const x = dx + (t.x || 0);
            const y = dy + (t.y || 0);
            const own = inAxis || /^Axis-/.test(String(node.key));
            if (own && node.type === "text" && node.lines.length) {
              const size = node.font.size;
              blocks.push({
                text: node.lines.map(l => l.text).join(" "),
                top: y + node.y + node.lines[0].y - size * 0.8,
                bottom:
                  y + node.y + node.lines[node.lines.length - 1].y + size * 0.2,
              });
            }
            (node.children || []).forEach(c => walk(c, x, y, own));
          };
          walk(viz._paintedScene.root, 0, 0, false);
          resolve({labels, blocks});
        } catch (e) {
          reject(e);
        }
      });
  });

const run = (chart, data, arg, axis, [width, height], renderer) =>
  render('<div id="viz"></div>', probe, [
    charts[chart],
    data,
    arg,
    axis,
    width,
    height,
    renderer,
  ]);

/** The pairs of painted text blocks that overlap, by more than half a pixel. */
const overlaps = blocks =>
  blocks.flatMap((a, i) =>
    blocks
      .slice(i + 1)
      .filter(b => a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5)
      .map(b => `"${a.text}" and "${b.text}"`),
  );

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a vertical bucketAxis color scale draws no overlapping labels`, async () => {
    for (const size of [
      [250, 160],
      [400, 160],
    ]) {
      const {labels, blocks} = await run(
        "colorScale",
        rows,
        ["right", "jenks", longLabel],
        "colorScale",
        size,
        renderer,
      );
      assert.ok(labels.length >= 2, `${size}: draws labels`);
      assert.deepStrictEqual(overlaps(blocks), [], `${size}: no overlap`);
    }
  });

  it(`[${renderer}] each axis label paints the lines measured for it, inside the room measured`, async () => {
    const cases = [
      ["line", categories, ["x"], "x", [500, 300]],
      ["line", categories, ["x"], "x", [300, 400]],
      ["line", categories, ["y"], "y", [500, 300]],
      ["line", categories, ["y"], "y", [400, 220]],
      [
        "colorScale",
        rows,
        ["bottom", "linear", "Color value "],
        "colorScale",
        [400, 300],
      ],
      [
        "colorScale",
        rows,
        ["bottom", "jenks", longLabel],
        "colorScale",
        [400, 300],
      ],
      [
        "colorScale",
        rows,
        ["right", "linear", "Color value "],
        "colorScale",
        [400, 300],
      ],
      [
        "colorScale",
        rows,
        ["right", "jenks", longLabel],
        "colorScale",
        [250, 160],
      ],
    ];
    for (const [chart, data, arg, axis, size] of cases) {
      const name = `${chart} ${arg.join(" ")} ${axis} ${size.join("×")}`;
      const {labels} = await run(chart, data, arg, axis, size, renderer);
      assert.ok(labels.length, `${name}: paints labels`);
      for (const {text, painted, measured} of labels) {
        const label = `${name}: "${text}"`;
        assert.ok(measured && !measured.truncated, `${label} was measured`);
        assert.strictEqual(painted.lineHeight, measured.lineHeight, label);
        assert.strictEqual(
          painted.lines.length,
          measured.lines.length,
          `${label}: painted ${JSON.stringify(painted.lines)}, measured ${JSON.stringify(measured.lines)}`,
        );
        assert.ok(
          painted.height <= measured.height + 0.5,
          `${label}: ${painted.height}px tall in ${measured.height}px`,
        );
        // A label cut short ends in the ellipsis it is painted with, which
        // the measure leaves off, so only a whole label's width is compared.
        if (measured.fits)
          assert.ok(
            painted.width <= measured.width + 0.5,
            `${label}: ${painted.width}px wide in ${measured.width}px (painted ${JSON.stringify(painted.lines)}, measured ${JSON.stringify(measured.lines)})`,
          );
      }
    }
  });
}
