import assert from "assert";
import it from "../jsdom.js";
import {LinePlot} from "../../es/index.js";

// A Line's colour is its stroke; its confidence band should fill with that same
// colour at reduced opacity. The band's fill accessor read a `shapeConfig.Line
// .stroke` key that no longer exists in v4, so it resolved to `undefined` — the
// band rendered as SVG-default black at 0.5 opacity (a solid grey slab over the
// line). It must instead resolve to the line's actual stroke colour.
it("confidence band fill matches the line's stroke colour at 0.5 opacity", () => {
  const plot = new LinePlot()
    .confidence([d => d.lci, d => d.hci])
    .groupBy("id")
    .x("time")
    .y("value");

  const datum = {__d3plus__: true, data: {id: "alpha", time: 2010, value: 10}, i: 0, id: "alpha"};
  const {fill, fillOpacity} = plot._confidenceConfig;

  const bandColor = fill(datum, 0);
  assert.ok(bandColor != null, "band fill resolves to a colour, not undefined");

  const lineStroke = plot.schema.shapeConfig.stroke(datum, 0);
  assert.strictEqual(
    String(bandColor), String(lineStroke),
    "band fill equals the line's stroke colour",
  );
  assert.strictEqual(fillOpacity(datum, 0), 0.5, "band is semi-transparent");
});
