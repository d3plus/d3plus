import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A bucketed colorScale's swatches (jenks/buckets/quantile draw as a
    legend) take their stroke and opacity from the chart's shapes, the way the
    categorical legend's swatches do: each swatch is painted like the shapes
    in its bucket, on light and dark backgrounds and for charts whose shapes
    carry a stroke of their own.
*/

const box = "<div id='viz' style='width:900px;height:360px'></div>";
const darkBox =
  "<div id='viz' style='width:900px;height:360px;background:#1d1f23'></div>";

/** Daily rows through 2024, every third day skipped. */
const days = Array.from({length: 120}, (_, k) => k)
  .filter(k => k % 3 !== 2)
  .map(k => {
    const d = new Date(2024, 0, 1 + k);
    const pad = v => String(v).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      value: (k % 9) + 1,
    };
  });

/**
    Builds the chart from `src` (`lib => viz`), renders it, and returns each
    bucket swatch's paint beside the paint of the chart's shapes that share
    its fill.
*/
const probe = async src => {
  const build = new Function("lib", `return (${src})(lib);`);
  const viz = build(window.d3plus).select("#viz").duration(0);
  await new Promise(r => viz.render(r));
  const all = [];
  const visit = n => {
    if (!n) return;
    all.push(n);
    (n.children || []).forEach(visit);
  };
  visit(viz.toScene().root);
  const bucketOf = n => {
    let d = n.datum;
    while (d && d.__d3plus__ && d.data) d = d.data;
    return d && d._isColorScaleBucket ? d : null;
  };
  const pick = p => ({
    stroke: p.stroke,
    strokeWidth: p.strokeWidth ?? 0,
    opacity: p.opacity ?? 1,
  });
  // Each swatch, without the transparent hit target drawn over it.
  const swatches = all.filter(
    n => n.type === "rect" && bucketOf(n) && !n.key.endsWith("::hit"),
  );
  const shapes = viz._chartScene
    .flatMap(n => {
      const out = [];
      const walk = c => {
        out.push(c);
        (c.children || []).forEach(walk);
      };
      walk(n);
      return out;
    })
    .filter(n => n.datum && !bucketOf(n) && ["rect", "path"].includes(n.type));
  return {
    dark: viz._colorScaleClass.schema.colorDefaults.dark,
    swatches: swatches.map(s => ({
      fill: s.paint.fill,
      ...pick(s.paint),
      shapes: [
        ...new Set(
          shapes
            .filter(n => n.paint.fill === s.paint.fill)
            .map(n => JSON.stringify(pick(n.paint))),
        ),
      ].map(j => JSON.parse(j)),
    })),
  };
};

/** Asserts every swatch is painted like the shapes that share its fill. */
const assertMatches = ({swatches}) => {
  assert.ok(swatches.length > 1, "draws a swatch per bucket");
  const matched = swatches.filter(s => s.shapes.length);
  assert.ok(matched.length > 1, "swatches share fills with the shapes");
  for (const s of matched) {
    assert.strictEqual(s.shapes.length, 1, `${s.fill}: one shape style`);
    const {stroke, strokeWidth, opacity} = s;
    assert.deepStrictEqual(
      {stroke, strokeWidth, opacity},
      s.shapes[0],
      `${s.fill}: swatch painted like its shapes`,
    );
  }
};

const calendar = `lib => new lib.Calendar()
  .data(${JSON.stringify(days)})
  .colorScaleConfig({scale: "jenks"})`;

it("Calendar's bucket swatches take the day cells' stroke, not a dark outline", async function () {
  const out = await render(box, probe, calendar);
  assertMatches(out);
  assert.ok(
    out.swatches.every(s => s.stroke !== out.dark && s.strokeWidth === 0),
    "no dark outline around the swatches",
  );
});

it("Calendar's bucket swatches match the cells on a dark background", async function () {
  const out = await render(
    darkBox,
    probe,
    `lib => new lib.Calendar()
      .data(${JSON.stringify(days)})
      .colorScaleConfig({color: ["#0e4429", "#006d32", "#26a641", "#39d353"]})`,
  );
  assertMatches(out);
});

it("bucket swatches follow a shapeConfig stroke, including one set per shape", async function () {
  const out = await render(
    box,
    probe,
    `lib => new lib.Calendar()
      .data(${JSON.stringify(days)})
      .shapeConfig({strokeWidth: 1, Rect: {stroke: "#ff00ff", opacity: 0.8}})`,
  );
  assertMatches(out);
  assert.ok(
    out.swatches.every(
      s => s.stroke === "#ff00ff" && s.strokeWidth === 1 && s.opacity === 0.8,
    ),
    "the swatches carry the per-shape stroke and opacity",
  );
});

it("Geomap's bucket swatches keep the topojson Paths' darker stroke", async function () {
  const out = await render(
    box,
    probe,
    `lib => new lib.Geomap()
      .groupBy("geo")
      .colorScale("value")
      .colorScaleConfig({scale: "jenks"})
      .tiles(false)
      .ocean("transparent")
      .topojson({
        type: "Topology",
        objects: {geo: {type: "GeometryCollection", geometries: [
          {type: "Polygon", id: "a", arcs: [[0]]},
          {type: "Polygon", id: "b", arcs: [[1]]},
          {type: "Polygon", id: "c", arcs: [[2]]},
          {type: "Polygon", id: "d", arcs: [[3]]},
        ]}},
        arcs: [
          [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
          [[20, 0], [20, 10], [30, 10], [30, 0], [20, 0]],
          [[40, 0], [40, 10], [50, 10], [50, 0], [40, 0]],
          [[60, 0], [60, 10], [70, 10], [70, 0], [60, 0]],
        ],
      })
      .data([
        {geo: "a", value: 10},
        {geo: "b", value: 20},
        {geo: "c", value: 35},
        {geo: "d", value: 80},
      ])`,
  );
  assertMatches(out);
  assert.ok(
    out.swatches.every(s => s.strokeWidth === 1 && s.stroke !== s.fill),
    "the swatches keep the paths' 1px stroke",
  );
});

it("colorScaleConfig.legendConfig.shapeConfig still styles the swatches", async function () {
  const out = await render(
    box,
    probe,
    `lib => new lib.Calendar()
      .data(${JSON.stringify(days)})
      .colorScaleConfig({legendConfig: {shapeConfig: {stroke: "#00ff00", strokeWidth: 2}}})`,
  );
  assert.ok(
    out.swatches.length > 1 &&
      out.swatches.every(s => s.stroke === "#00ff00" && s.strokeWidth === 2),
    "the colorScale's own swatch config wins",
  );
});

it("_colorScaleShape: a row's shape, or a Geomap row's topojson Path", async function () {
  const out = await render(box, () => {
    const {Calendar, Geomap} = window.d3plus;
    const geomap = new Geomap().point(d => d.point);
    return {
      calendar: new Calendar()._colorScaleShape({}, 0),
      path: geomap._colorScaleShape({id: "a"}, 0),
      point: geomap._colorScaleShape({id: "b", point: [0, 0]}, 0),
    };
  });
  assert.deepStrictEqual(out, {
    calendar: "Rect",
    path: "Path",
    point: "Circle",
  });
});
