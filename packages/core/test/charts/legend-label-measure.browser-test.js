import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A chart's legend measures each label as its TextBox paints it: at the
    painted line height (1.2 times the font size, or the label config's
    `lineHeight`), so a label measured as N lines paints as N lines in the
    room measured for it, no taller. Labels were measured at 1.4 times the
    font size, and claimed 2px more per line than they painted. Driven in
    real Chromium for text measurement, in SVG and on canvas.
*/

const names = [
  "Agriculture, Forestry, Fishing and Hunting",
  "Professional, Scientific, and Technical Services",
  "Health Care and Social Assistance",
  "Arts, Entertainment, and Recreation",
  "Accommodation and Food Services",
];

/**
    Renders a `width` × `height` LinePlot with a legend at `position` and
    reads each legend label as measured (its `_lineData` entry) beside the
    label its TextBox paints.
*/
const probe = ([names, width, height, position, legendConfig, renderer]) =>
  new Promise((resolve, reject) => {
    const el = document.createElement("div");
    el.style.cssText = `width:${width}px;height:${height}px`;
    document.body.appendChild(el);
    const data = names.flatMap((id, i) => [
      {id, x: 1, y: i + 1},
      {id, x: 2, y: i + 3},
    ]);
    const viz = new window.d3plus.LinePlot()
      .lineLabels(false)
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .legendPosition(position)
      .legendConfig(legendConfig)
      .renderer(renderer)
      .duration(0)
      .select(el);
    viz.render(() => {
      try {
        const legend = viz._legendClass;
        const painted = new Map();
        for (const shape of legend._shapes)
          for (const t of shape._labelClass._textData())
            painted.set(t.data.data.id, {
              lines: t.lines,
              lineHeight: t.lH,
              width: Math.max(...t.widths),
              box: {width: t.w, height: t.h},
            });
        // The painted scene's legend text: each label's line spacing.
        const spacing = [];
        const walk = (node, inLegend) => {
          const own = inLegend || /^Legend-/.test(String(node.key));
          if (own && node.type === "text")
            for (let i = 1; i < node.lines.length; i++)
              spacing.push(node.lines[i].y - node.lines[i - 1].y);
          (node.children || []).forEach(c => walk(c, own));
        };
        walk(viz._paintedScene.root, false);
        const labels = legend._lineData.map(d => ({
          id: d.id,
          measured: {
            lines: d.lines,
            lineHeight: d.lh,
            width: d.width,
            height: d.height,
          },
          painted: painted.get(d.id),
        }));
        el.remove();
        resolve({labels, spacing});
      } catch (e) {
        reject(e);
      }
    });
  });

const run = (size, position, legendConfig, renderer) =>
  render("", probe, [names, ...size, position, legendConfig, renderer]);

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] each legend label paints the lines measured for it, at the measured line height`, async () => {
    const cases = [
      [[600, 300], "right", {}, 12],
      [[200, 300], "right", {}, 12],
      [[450, 400], "bottom", {}, 12],
      [[260, 300], "right", {shapeConfig: {labelConfig: {fontSize: 14}}}],
      [[200, 300], "right", {shapeConfig: {labelConfig: {lineHeight: 20}}}, 20],
    ];
    let wrapped = 0;
    for (const [size, position, config, lineHeight] of cases) {
      const name = `${size.join("×")} ${position} ${JSON.stringify(config)}`;
      const {labels, spacing} = await run(size, position, config, renderer);
      assert.ok(labels.length, `${name}: draws a legend`);
      for (const {id, measured, painted} of labels) {
        const label = `${name}: "${id}"`;
        if (!measured.width) continue;
        assert.ok(painted, `${label}: paints a label`);
        if (lineHeight) assert.strictEqual(painted.lineHeight, lineHeight);
        assert.strictEqual(measured.lineHeight, painted.lineHeight, label);
        // A label wrapped to fit its row keeps its first-measured `lines`;
        // its height holds the lines it was measured as.
        const lines = Math.round(measured.height / (measured.lineHeight + 1));
        assert.strictEqual(
          painted.lines.length,
          lines,
          `${label}: painted ${JSON.stringify(painted.lines)}, measured ${lines} lines`,
        );
        if (lines > 1) wrapped++;
        // The room measured holds the painted lines, a pixel above each.
        assert.ok(
          Math.abs(measured.height - lines * (painted.lineHeight + 1)) < 1,
          `${label}: ${measured.height}px measured for ${lines} × ${painted.lineHeight}px`,
        );
        assert.ok(
          painted.width <= measured.width,
          `${label}: ${painted.width}px wide in ${measured.width}px`,
        );
      }
      if (labels.some(l => l.painted?.lines.length > 1))
        assert.ok(spacing.length, `${name}: paints wrapped lines`);
      for (const s of spacing)
        assert.ok(
          Math.abs(s - labels[0].measured.lineHeight) < 0.01,
          `${name}: painted lines ${s}px apart`,
        );
    }
    assert.ok(wrapped, "some labels wrap onto more than one line");
  });
}

/**
    Renders a LinePlot with a right legend `legendWidth` wide and reads each
    legend item's painted label lines, the width the legend reports for each
    item alone (`_rowWidth`), and its outer width.
*/
const fitProbe = ([names, legendWidth, renderer]) =>
  new Promise((resolve, reject) => {
    const el = document.createElement("div");
    el.style.cssText = "width:600px;height:300px";
    document.body.appendChild(el);
    const data = names.flatMap((id, i) => [
      {id, x: 1, y: i + 1},
      {id, x: 2, y: i + 3},
    ]);
    const viz = new window.d3plus.LinePlot()
      .lineLabels(false)
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .legendPosition("right")
      .legendConfig({width: legendWidth})
      .renderer(renderer)
      .duration(0)
      .select(el);
    viz.render(() => {
      try {
        const legend = viz._legendClass;
        const lines = new Map();
        for (const shape of legend._shapes)
          for (const t of shape._labelClass._textData())
            lines.set(t.data.data.id, t.lines);
        const result = {
          room: legend.width() - legend.padding() * 2,
          outer: legend.outerBounds().width,
          items: legend._lineData.map(d => ({
            id: d.id,
            reported: legend._rowWidth([d]),
            lines: lines.get(d.id),
          })),
        };
        el.remove();
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] legend labels wrap only when wider than the width the legend reports`, async () => {
    const fit = width => render("", fitProbe, [names, width, renderer]);
    const wide = await fit(500);
    const widest = Math.max(...wide.items.map(d => d.reported));
    assert.ok(
      wide.items.every(d => d.lines.length === 1),
      "a wide legend draws each label on one line",
    );
    for (const slack of [0, 3, 9]) {
      const {room, outer, items} = await fit(widest + 10 + slack);
      assert.strictEqual(room, widest + slack);
      for (const d of items)
        assert.strictEqual(
          d.lines?.length,
          1,
          `${slack}px slack: "${d.id}" (${d.reported}px in ${room}px) keeps one line, painted ${JSON.stringify(d.lines)}`,
        );
      assert.ok(outer <= room, `${slack}px slack: ${outer}px in ${room}px`);
    }
    const narrow = await fit(widest + 10 - 1);
    assert.ok(
      narrow.items.some(d => d.lines?.length > 1),
      "1px short of the widest item, its label wraps",
    );
    assert.ok(narrow.outer <= narrow.room, "and the legend fits its room");
  });
}
