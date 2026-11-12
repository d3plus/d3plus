import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot too short for its y axis labels its x domain's ends, claiming
    their room against the chart area before the chrome (title, legend, the
    corner controls' reach) has claimed its margins. A chart just tall
    enough for them before the chrome's top margin (the corner controls'
    reach, 29px on macOS) drew them over a plot collapsed to 0px up to 49px
    tall, and over a plot shorter than they are up to 68px. It now drops
    them when the room the chrome leaves can't hold both, and the plot keeps
    that room. Driven in real Chromium, in SVG and on canvas.
*/

/**
    Renders a 420px-wide LinePlot of each height in `heights`, with its
    corner controls (zoom, table view, …) or without them (`controls`), and
    reports its plot area, top margin and painted end labels.
*/
const probe = ([heights, controls, renderer]) =>
  new Promise((resolve, reject) => {
    const results = [];
    const next = i => {
      if (i === heights.length) return resolve(results);
      const height = heights[i];
      const el = document.createElement("div");
      el.style.cssText = `width:420px;height:${height}px`;
      document.body.appendChild(el);
      const data = [];
      for (let x = 0; x <= 30; x += 3)
        data.push({id: "a", x, y: ((x * 7) % 13) + 2});
      const viz = new window.d3plus.LinePlot()
        .data(data)
        .groupBy("id")
        .x("x")
        .y("y")
        .config(
          controls
            ? {}
            : {
                zoom: false,
                saveControl: false,
                tableView: false,
                search: false,
              },
        )
        .legend(false)
        .renderer(renderer)
        .duration(0)
        .select(el);
      viz.render(() => {
        try {
          const labels = [];
          const walk = (node, inLabels) => {
            const own = inLabels || node.key === "plot-x-end-labels";
            if (own && node.type === "text")
              labels.push({
                text: node.lines.map(l => l.text).join(" "),
                top: node.transform.y,
                height: node.height,
              });
            (node.children || []).forEach(c => walk(c, own));
          };
          walk(viz._paintedScene.root, false);
          results.push({
            height,
            plot: viz._plotArea.height,
            top: viz._margin.top,
            labels,
          });
          el.remove();
          next(i + 1);
        } catch (e) {
          reject(e);
        }
      });
    };
    next(0);
  });

const run = (heights, controls, renderer) =>
  render("", probe, [heights, controls, renderer]);

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a short chart draws end labels only when the room its chrome leaves holds them and a plot as tall`, async () => {
    // The chrome's top margin leaves no room for the labels: the plot keeps it.
    for (const {height, plot, top, labels} of await run(
      [40, 41, 42, 43, 50, 60],
      true,
      renderer,
    )) {
      assert.ok(top >= 20, `${height}px: the corner controls' reach on top`);
      assert.deepStrictEqual(
        labels.map(l => l.text),
        [],
        `${height}px: no end labels`,
      );
      assert.strictEqual(plot, height - top, `${height}px: the plot keeps it`);
    }
    // Room for both, with the corner controls or without them.
    const rooms = [
      ...(await run([80, 120], true, renderer)),
      ...(await run([40, 43], false, renderer)),
    ];
    for (const {height, plot, top, labels} of rooms) {
      assert.deepStrictEqual(
        labels.map(l => l.text),
        ["0", "30"],
        `${height}px: end labels`,
      );
      const claim = height - top - plot;
      assert.ok(plot >= claim, `${height}px: a ${plot}px plot for ${claim}px`);
    }
    // In between, they appear once the chart is tall enough for both, and
    // stay (where that is depends on the font's metrics).
    const between = Array.from({length: 19}, (_, i) => 61 + i);
    let drawn = false;
    for (const {height, plot, top, labels} of await run(
      between,
      true,
      renderer,
    )) {
      if (labels.length) {
        drawn = true;
        assert.deepStrictEqual(
          labels.map(l => l.text),
          ["0", "30"],
          `${height}px: end labels`,
        );
        const claim = height - top - plot;
        assert.ok(
          plot >= claim,
          `${height}px: a ${plot}px plot for ${claim}px`,
        );
      } else {
        assert.ok(
          !drawn,
          `${height}px: keeps the end labels a shorter chart drew`,
        );
        assert.strictEqual(
          plot,
          height - top,
          `${height}px: the plot keeps it`,
        );
      }
    }
  });
}
