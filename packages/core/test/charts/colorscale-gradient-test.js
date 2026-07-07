import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Smooth-gradient ColorScale on the scene path.

    A smooth (non-bucketed) gradient used to set its Rect fill to
    `url(#gradient-<uuid>)`, backed by a `<defs>` built imperatively on the
    off-stage compute svg — which the scene pipeline clears, so the gradient
    never painted. The fill is now a serializable `gradient:<json>` token
    (built in renderGradientStops); the SvgRenderer materializes it into a
    `<linearGradient>` under the painted svg's own `<defs>` and points the
    Rect at it. This renders a smooth-gradient colorScale through Chromium and
    asserts the gradient survives into the painted output.
*/

const builderSrc = `lib => new lib.Geomap()
  .groupBy("geo")
  .colorScale("value")
  .colorScaleConfig({scale: "linear"})
  .tiles(false)
  .ocean("transparent")
  .topojson({
    type: "Topology",
    objects: {geo: {type: "GeometryCollection", geometries: [
      {type: "Polygon", id: "a", arcs: [[0]]},
      {type: "Polygon", id: "b", arcs: [[1]]},
    ]}},
    arcs: [
      [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
      [[20, 0], [20, 10], [30, 10], [30, 0], [20, 0]],
    ],
  })
  .data([
    {geo: "a", value: 10},
    {geo: "b", value: 20},
    {geo: "c", value: 35},
  ])`;

const probeFn = src =>
  new Promise((resolve, reject) => {
    try {
      const build = new Function("lib", `return (${src})(lib);`);
      const viz = build(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const svg = document.querySelector("#viz svg");
          if (!svg) return reject(new Error("no chart svg rendered"));

          const grads = [...svg.querySelectorAll("defs linearGradient")];
          const gradient = grads[0];
          const stops = gradient
            ? [...gradient.querySelectorAll("stop")].map(s => ({
                offset: s.getAttribute("offset"),
                color: s.getAttribute("stop-color"),
              }))
            : [];

          // The rect that points at the gradient.
          const fills = [...svg.querySelectorAll("rect")].map(r =>
            r.getAttribute("fill"),
          );

          resolve({
            gradientCount: grads.length,
            gradientId: gradient ? gradient.getAttribute("id") : null,
            stops,
            fills,
          });
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });

after(closeBrowser);

it("smooth-gradient ColorScale paints a <linearGradient> a rect references", async function () {
  this.timeout(60000);
  const body =
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>';
  const fp = await render(body, probeFn, builderSrc);

  assert.ok(
    fp.gradientCount >= 1,
    "a <linearGradient> is materialized under the painted svg's <defs>",
  );
  assert.ok(fp.gradientId, "the gradient has an id");
  assert.ok(
    fp.stops.length >= 2,
    `the gradient has multiple color stops (got ${fp.stops.length})`,
  );

  const ref = `url(#${fp.gradientId})`;
  assert.ok(
    fp.fills.includes(ref),
    `a rect fill resolves to ${ref} (rect fills: ${JSON.stringify(fp.fills)})`,
  );
});
