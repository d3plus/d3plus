import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A left or right legend/colorScale lays out after everything positioned at
    the top or bottom, in the band between their claims, and starts below
    the corner control panel on its own side: the top-left panel (table
    view, search) on the left, the zoom controls on the right.
*/

const names = Array.from(
  {length: 12},
  (_, i) => `Series ${String.fromCharCode(65 + i)}`,
);

/**
    Renders the chart `src` builds (`lib`, `data` → viz) and returns, in
    chart coordinates: the legend's and colorScale's boxes, the title's
    baseline, the timeline's top, the top/bottom edges of the corner
    controls on each side, and the chart's margin.
*/
const layout = (src, renderer, {width = 640, height = 420} = {}) =>
  render(
    `<div id="s" style="width:${width}px;height:${height}px"></div>`,
    ({src, renderer, names}) =>
      new Promise((resolve, reject) => {
        const data = names.flatMap((id, i) =>
          [2019, 2020, 2021].map((year, j) => ({
            id,
            year,
            value: 10 + ((i * 37 + j * 11) % 90),
            share: i < 4 ? 10 + i * 9 + j : undefined,
          })),
        );
        const viz = new Function("lib", "data", `return (${src})(lib, data);`)(
          window.d3plus,
          data,
        )
          .select("#s")
          .renderer(renderer)
          .duration(0);
        viz.render(() => {
          try {
            // Each node with its accumulated translate.
            const nodes = [];
            const walk = (n, x, y) => {
              const t = n.transform || {};
              const nx = x + (t.x || 0);
              const ny = y + (t.y || 0);
              nodes.push({n, x: nx, y: ny});
              (n.children || []).forEach(c => walk(c, nx, ny));
            };
            walk(viz.toScene().root, 0, 0);
            const componentBox = cls => {
              if (!cls) return null;
              const key = `${cls.constructor.name}-${cls._uuid.slice(0, 8)}`;
              const hit = nodes.find(({n}) => n.key === key);
              const ob = cls.outerBounds();
              if (!hit || !ob.width || !ob.height) return null;
              return {
                left: hit.x + ob.x,
                right: hit.x + ob.x + ob.width,
                top: hit.y + ob.y,
                bottom: hit.y + ob.y + ob.height,
              };
            };
            // The band the legend was given to lay out in.
            const legendFrame = cls => {
              const key = `Legend-${cls._uuid.slice(0, 8)}`;
              const hit = nodes.find(({n}) => n.key === key);
              return hit ? {top: hit.y, bottom: hit.y + cls.height()} : null;
            };
            const title = nodes.find(({n}) => n.key === "viz-title");
            const surface = [...document.querySelectorAll("#s svg, #s canvas")]
              .map(e => e.getBoundingClientRect())
              .sort((a, b) => b.width * b.height - a.width * a.height)[0];
            const edges = selector => {
              const rects = [...document.querySelectorAll(selector)].map(e =>
                e.getBoundingClientRect(),
              );
              return rects.length
                ? {
                    top: Math.min(...rects.map(r => r.top)) - surface.top,
                    bottom: Math.max(...rects.map(r => r.bottom)) - surface.top,
                  }
                : null;
            };
            const timeline = viz._timelineClass?.outerBounds();
            resolve({
              legend: componentBox(viz._legendClass),
              legendFrame: legendFrame(viz._legendClass),
              colorScale: componentBox(viz._colorScaleClass),
              titleBaseline: title
                ? title.y +
                  (title.n.y || 0) +
                  Math.max(...title.n.lines.map(l => l.y))
                : null,
              timelineTop: timeline && timeline.height ? timeline.y : null,
              zoom: edges("#s .zoom-control"),
              topLeft: edges("#s .d3plus-top-left-controls-item button"),
              margin: {...viz._margin},
              height: viz.schema.height,
            });
          } catch (e) {
            reject(e);
          }
        });
      }),
    {src, renderer, names},
  );

/** Asserts `box` sits wholly between `top` and `bottom`. */
function assertWithin(box, top, bottom, label) {
  assert.ok(box, `${label}: drawn`);
  if (top !== null && top !== undefined)
    assert.ok(box.top >= top - 0.5, `${label}: top ${box.top} >= ${top}`);
  if (bottom !== null && bottom !== undefined)
    assert.ok(
      box.bottom <= bottom + 0.5,
      `${label}: bottom ${box.bottom} <= ${bottom}`,
    );
}

const treemap = extra => `(lib, data) => new lib.Treemap()
  .data(data).groupBy("id").sum("value")${extra}`;
const linePlot = extra => `(lib, data) => new lib.LinePlot()
  .data(data).groupBy("id").x("year").y("value").legendInset(false)${extra}`;

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a left colorScale starts below the top-left controls and ends above the timeline`, async () => {
    const out = await layout(
      treemap(`.time("year").colorScale("value")
        .colorScaleConfig({scale: "linear"}).colorScalePosition("left")
        .tableView(true).search(true).zoom(false)`),
      renderer,
    );
    assert.ok(out.topLeft, "the top-left controls show");
    assert.ok(out.timelineTop, "the timeline shows");
    assertWithin(
      out.colorScale,
      out.topLeft.bottom,
      out.timelineTop,
      `${renderer} left colorScale`,
    );
  });

  it(`${renderer}: a left colorScale starts below a title and a top legend`, async () => {
    const out = await layout(
      treemap(`.colorScale("share").colorScaleConfig({scale: "linear"})
        .colorScalePosition("left").legendPosition("top").title("Title")
        .tableView(true).zoom(false)`),
      renderer,
    );
    assert.ok(out.legend, "the top legend shows");
    assert.ok(
      out.legend.top >= out.titleBaseline,
      "the legend is below the title",
    );
    assertWithin(
      out.colorScale,
      Math.max(out.legend.bottom, out.topLeft.bottom),
      out.height,
      `${renderer} left colorScale`,
    );
  });

  it(`${renderer}: a right colorScale starts below the zoom controls`, async () => {
    const out = await layout(
      treemap(`.colorScale("value").colorScaleConfig({scale: "linear"})
        .colorScalePosition("right").zoom(true).tableView(false)
        .search(false).saveControl(false)`),
      renderer,
    );
    assert.ok(out.zoom, "the zoom controls show");
    assertWithin(
      out.colorScale,
      out.zoom.bottom,
      out.height,
      `${renderer} right colorScale`,
    );
  });

  it(`${renderer}: a right legend starts below a title, a top colorScale and the zoom controls`, async () => {
    const out = await layout(
      treemap(`.time("year").colorScale("share").colorScalePosition("top")
        .legendPosition("right").title("Title").zoom(true)`),
      renderer,
    );
    assert.ok(out.colorScale, "the top colorScale shows");
    assert.ok(
      out.colorScale.top >= out.titleBaseline,
      "the colorScale is below the title",
    );
    assertWithin(
      out.legendFrame,
      Math.max(out.colorScale.bottom, out.zoom.bottom),
      out.timelineTop,
      `${renderer} right legend`,
    );
  });

  it(`${renderer}: a left legend starts below the controls and a title and ends above a bottom colorScale`, async () => {
    const chart = colorScale =>
      linePlot(`.colorScale(${colorScale}).colorScalePosition("bottom")
        .legendPosition("left").title("Title").tableView(true).zoom(true)`);
    const out = await layout(chart('"share"'), renderer);
    const alone = await layout(chart("false"), renderer);
    assert.ok(out.colorScale, "the bottom colorScale shows");
    assertWithin(
      out.legendFrame,
      Math.max(out.titleBaseline, out.topLeft.bottom),
      out.colorScale.top,
      `${renderer} left legend`,
    );
    const claim = out.margin.bottom - alone.margin.bottom;
    assert.ok(claim > 0, "the colorScale claims the bottom");
    assert.ok(
      out.legendFrame.bottom <= alone.legendFrame.bottom - claim + 0.5,
      `the legend's band ends above the colorScale's claim (${out.legendFrame.bottom} vs ${alone.legendFrame.bottom} - ${claim})`,
    );
  });

  it(`${renderer}: small multiples keep a left colorScale below the top-left controls`, async () => {
    const out = await layout(
      treemap(`.facet(d => d.id < "Series G" ? "East" : "West")
        .colorScale("value").colorScaleConfig({scale: "linear"})
        .colorScalePosition("left").tableView(true).zoom(false)`),
      renderer,
    );
    assertWithin(
      out.colorScale,
      out.topLeft.bottom,
      out.height,
      `${renderer} faceted left colorScale`,
    );
  });

  it(`${renderer}: a Geomap's right colorScale starts below its zoom controls`, async () => {
    const square = (x, y) => [
      [x, y],
      [x, y + 10],
      [x + 10, y + 10],
      [x + 10, y],
      [x, y],
    ];
    const topojson = {
      type: "Topology",
      objects: {
        shapes: {
          type: "GeometryCollection",
          geometries: names.map((id, i) => ({
            type: "Polygon",
            arcs: [[i]],
            id,
          })),
        },
      },
      arcs: names.map((_, i) => square((i % 4) * 12, Math.floor(i / 4) * 12)),
    };
    const out = await layout(
      `(lib, data) => new lib.Geomap()
        .data(data.filter(d => d.year === 2019))
        .groupBy("id").topojson(${JSON.stringify(topojson)})
        .tiles(false).colorScale("value")
        .colorScaleConfig({scale: "linear"}).colorScalePosition("right")
        .zoom(true).tableView(false).search(false).saveControl(false)`,
      renderer,
    );
    assert.ok(out.zoom, "the zoom controls show");
    assertWithin(
      out.colorScale,
      out.zoom.bottom,
      out.height,
      `${renderer} Geomap right colorScale`,
    );
  });

  it(`${renderer}: with no controls and no title, a side colorScale centers in the full height`, async () => {
    const out = await layout(
      treemap(`.colorScale("value").colorScaleConfig({scale: "linear"})
        .colorScaleConfig({padding: 0}).colorScalePosition("left")
        .colorScaleMaxSize(200).colorScalePadding(false).zoom(false)
        .tableView(false).search(false).saveControl(false)`),
      renderer,
    );
    assert.strictEqual(out.zoom, null, "no zoom controls");
    assert.strictEqual(out.topLeft, null, "no top-left controls");
    assert.strictEqual(out.margin.top, 0, "nothing claims the top");
    // The colorScale's 200px frame sits in the middle of the chart's height.
    const middle = (out.colorScale.top + out.colorScale.bottom) / 2;
    assert.ok(
      Math.abs(middle - out.height / 2) <= 12,
      `centered (${middle} vs ${out.height / 2})`,
    );
  });
}

it("a bottom colorScale lays out the same with or without a side legend", async () => {
  const chart = legend =>
    linePlot(`.colorScale("share").colorScalePosition("bottom")
      .legendPosition("left").legend(${legend}).zoom(false).tableView(false)
      .search(false).saveControl(false)`);
  const withLegend = await layout(chart(true), "svg");
  const without = await layout(chart(false), "svg");
  assert.ok(withLegend.legend, "the left legend shows");
  assert.deepStrictEqual(withLegend.colorScale, without.colorScale);
  assert.ok(
    withLegend.legend.bottom <= withLegend.colorScale.top + 0.5,
    "the left legend ends above it",
  );
});
