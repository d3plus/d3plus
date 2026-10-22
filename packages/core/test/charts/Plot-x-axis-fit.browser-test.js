import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot's x axis claims its labels' height across the chart area before
    the chrome (a legend beside the plot) takes its width, then draws them
    across the narrower plot that's left, where they can wrap onto more
    lines. The plot still ends where the axis begins: its domain line meets
    the bars' base, and every label sits below it.
*/

/**
    Renders a chart and reads its painted scene back (either renderer): the x
    axis's labels (lines and top edge), its domain line, and the bottom edge
    of the bars, all in the chart body's coordinates.
*/
const drawAxisFit = ([chart, config, rows]) =>
  new Promise(resolve => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const viz = new window.d3plus[chart]()
      .select(el)
      .data(rows)
      .duration(0)
      .height(350)
      .config(config);
    viz.render(() => {
      const out = {
        labels: [],
        domain: undefined,
        barBottom: -Infinity,
        rotated: viz._xAxis._labelRotation,
      };
      const walk = (node, dx, dy, axis) => {
        if (!node || node.key === "textBox-group" || node.key === "viz-legend")
          return;
        const x = dx + (node.transform?.x ?? 0),
          y = dy + (node.transform?.y ?? 0);
        const inAxis = axis || /(?:^|\/)plot-x-axis$/.test(node.key || "");
        if (inAxis && node.type === "text")
          out.labels.push({
            lines: node.lines.map(l => l.text),
            top: y + node.y,
            rotate: node.transform?.rotate ?? 0,
          });
        else if (inAxis && node.type === "line" && node.key === "bar")
          out.domain = y + Math.min(...node.points.map(p => p[1]));
        else if (
          !inAxis &&
          node.type === "rect" &&
          /_/.test(node.key || "") &&
          !/::hit$/.test(node.key)
        )
          out.barBottom = Math.max(out.barBottom, y + node.y + node.height);
        (node.children || []).forEach(c => walk(c, x, y, inAxis));
      };
      walk(viz._paintedScene && viz._paintedScene.root, 0, 0, false);
      resolve(out);
    });
  });

/** Asserts the x axis's domain line meets the bars' base, with every label below it. */
const assertBelow = (out, message) => {
  assert.ok(
    Number.isFinite(out.barBottom) && out.domain !== undefined,
    `${message}: bars and a domain line drawn`,
  );
  assert.ok(
    Math.abs(out.domain - out.barBottom) <= 0.5,
    `${message}: the domain line (${out.domain}) meets the bars' base (${out.barBottom})`,
  );
  out.labels.forEach(l =>
    assert.ok(
      l.top >= out.domain,
      `${message}: ${l.lines} (${l.top}) below the domain line (${out.domain})`,
    ),
  );
};

const cats = [
  "Agriculture and Forestry",
  "Mining and Quarrying",
  "Manufacturing Industries",
  "Electricity Gas and Steam",
  "Construction Services",
  "Wholesale Retail Trade",
];
const rows = cats.flatMap((c, i) =>
  ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"].map((g, j) => ({
    c,
    g,
    v: 10 + ((i * 7 + j * 3) % 11),
  })),
);

for (const renderer of ["svg", "canvas"]) {
  for (const width of [600, 650, 700, 900]) {
    it(`BarChart at ${width} × 350: wrapped x labels drawn beside a legend keep the axis beneath the bars (${renderer})`, async function () {
      const out = await render("", drawAxisFit, [
        "BarChart",
        {renderer, width, groupBy: "g", x: "c", y: "v", stacked: true},
        rows,
      ]);
      assert.ok(
        out.labels.length >= 4,
        `labels: ${JSON.stringify(out.labels)}`,
      );
      assertBelow(out, `${width}px`);
    });
  }
}
