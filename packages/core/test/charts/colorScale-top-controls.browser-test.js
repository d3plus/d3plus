import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A colorScale at the top of a chart keeps clear of the corner control
    panels (the table view, save and search buttons at the top left, the
    zoom buttons at the top right), as a top legend does, in a real browser
    on both renderers: beside them when it draws there as well as across the
    chart, else below them. Every button stays clickable, and a scale that
    already sat clear of them is drawn as before.
*/

const rows = Array.from({length: 30}, (_, i) => ({
  id: `n${i}`,
  v: (((i + 1) * 137) % 1000) + i,
}));

const scales = {
  gradient: {scale: "linear"},
  "bucketed bar": {scale: "jenks", bucketAxis: true},
  swatches: {scale: "jenks"},
};

/**
    Draws the chart into `#${arg.target}` and reports the boxes of its
    colorScale's colors and text, its buttons' boxes and whether each takes
    a click at its center, and its margin.
*/
const draw = arg =>
  new Promise(resolve => {
    const viz = new window.d3plus.Treemap()
      .config({
        data: arg.rows,
        groupBy: "id",
        sum: "v",
        colorScale: "v",
        colorScalePosition: "top",
        colorScaleConfig: arg.scale,
        ...(arg.controls === false
          ? {zoom: false, saveControl: false, search: false, tableView: false}
          : {}),
      })
      .renderer(arg.renderer)
      .duration(0)
      .select(`#${arg.target}`);
    viz.render(() => {
      const shapes = [];
      const labels = [];
      const walk = (n, dx, dy) => {
        const x = dx + ((n.transform && n.transform.x) || 0);
        const y = dy + ((n.transform && n.transform.y) || 0);
        if (n.type === "rect")
          shapes.push([
            x + n.x,
            y + n.y,
            x + n.x + n.width,
            y + n.y + n.height,
          ]);
        else if (n.type === "text") {
          const size = (n.font && n.font.size) || 12;
          const anchor = (n.font && n.font.anchor) || "start";
          for (const line of n.lines) {
            const shift =
              anchor === "middle"
                ? line.width / 2
                : anchor === "end"
                  ? line.width
                  : 0;
            const left = x + n.x + line.x - shift;
            const base = y + n.y + line.y;
            shapes.push([left, base - size, left + line.width, base + size]);
          }
          labels.push(n.lines.map(l => l.text).join(" "));
        }
        (n.children || []).forEach(c => walk(c, x, y));
      };
      const scale = viz._paintedScene.root.children.find(
        n => n.key === "viz-colorScale",
      );
      if (scale) walk(scale, 0, 0);
      const host = document.querySelector(`#${arg.target}`);
      const origin = host.getBoundingClientRect();
      // The corner buttons: the zoom buttons and each top-left toggle (not
      // the save menu's items or the search box's clear button, shown only
      // once their toggle opens them).
      const buttons = Array.from(
        host.querySelectorAll("button.zoom-control, button[class*='-toggle']"),
      )
        .map(button => [button, button.getBoundingClientRect()])
        .filter(([, r]) => r.width > 0 && r.height > 0)
        .map(([button, r]) => {
          const hit = document.elementFromPoint(
            r.left + r.width / 2,
            r.top + r.height / 2,
          );
          return {
            name: button.className,
            box: [
              r.left - origin.left,
              r.top - origin.top,
              r.right - origin.left,
              r.bottom - origin.top,
            ],
            clickable: Boolean(hit && hit.closest("button") === button),
          };
        });
      resolve({shapes, labels, buttons, margin: viz._margin});
    });
  });

/** Draws one chart per variant, `size` wide and tall, one under another. */
const drawVariants = (arg, variants, [w, h]) =>
  render(
    variants
      .map(
        (_, i) => `<div id='v${i}' style='width:${w}px;height:${h}px'></div>`,
      )
      .join(""),
    new Function(
      "arg",
      `const draw = ${draw};
      return arg.variants.reduce(
        (done, variant, i) =>
          done.then(out =>
            draw({...arg, ...variant, target: "v" + i}).then(d => [...out, d]),
          ),
        Promise.resolve([]),
      );`,
    ),
    {rows, ...arg, variants},
  );

const overlaps = (a, b) =>
  a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

for (const renderer of ["svg", "canvas"])
  for (const [name, scale] of Object.entries(scales))
    it(`[${renderer}] a ${name} colorScale at the top of a narrow chart keeps clear of the corner buttons`, async () => {
      const [chart] = await drawVariants({renderer, scale}, [{}], [250, 200]);
      assert.ok(chart.shapes.length > 0, "the colorScale is painted");
      assert.ok(chart.buttons.length >= 4, `buttons (${chart.buttons.length})`);
      for (const button of chart.buttons) {
        const hit = chart.shapes.find(s => overlaps(s, button.box));
        assert.ok(
          !hit,
          `clear of ${button.name} (${button.box.map(Math.round)}): ${hit && hit.map(Math.round)}`,
        );
        assert.ok(button.clickable, `${button.name} takes a click`);
      }
      // Below the buttons, the scale takes at most a third of the chart.
      const below = Math.max(...chart.buttons.map(b => b.box[3]));
      assert.ok(
        chart.margin.top - below <= 200 / 3,
        `the scale takes at most a third (${chart.margin.top} - ${below})`,
      );
    });

for (const renderer of ["svg", "canvas"])
  it(`[${renderer}] swatches at the top of a wide chart draw as with no corner buttons`, async () => {
    const [withButtons, without] = await drawVariants(
      {renderer, scale: scales.swatches},
      [{}, {controls: false}],
      [600, 400],
    );
    assert.ok(withButtons.labels.length > 0, "labeled");
    assert.deepStrictEqual(withButtons.labels, without.labels, "same labels");
    assert.deepStrictEqual(withButtons.shapes, without.shapes, "same place");
  });
