import {it} from "vitest";
import assert from "assert";
import {
  bareRegionName,
  isBareRegion,
} from "../../src/charts/features/bareRegion.ts";
import {geomapTooltipConfig} from "../../src/charts/Geomap/densityTooltip.ts";
import {Geomap} from "../../index.ts";

const feature = (properties, id = "x") => ({
  type: "Feature",
  id,
  properties,
  geometry: null,
});
const region = (f, data) => ({__d3plus__: true, data, feature: f, id: f.id});

it("isBareRegion — a region wrapper with no data row", () => {
  assert.strictEqual(isBareRegion(region(feature({}))), true);
  assert.strictEqual(isBareRegion(region(feature({}), null)), true);
  assert.strictEqual(isBareRegion(region(feature({}), {id: "x"})), false);
  assert.strictEqual(isBareRegion(feature({})), false, "a bare feature");
  assert.strictEqual(isBareRegion({id: "x", city: "Boston"}), false);
  assert.strictEqual(isBareRegion({__d3plus__: true, i: 0}), false);
  assert.strictEqual(isBareRegion(undefined), false);
});

it("bareRegionName — its feature's name, else its id", () => {
  assert.strictEqual(
    bareRegionName(region(feature({name: "Beta Land"}))),
    "Beta Land",
  );
  assert.strictEqual(bareRegionName(region(feature({}), undefined)), "x");
  assert.strictEqual(bareRegionName(region(feature(null, 7))), "7");
  assert.strictEqual(bareRegionName(region(feature({name: ""}, "y"))), "y");
  assert.strictEqual(
    bareRegionName({__d3plus__: true, feature: feature({})}),
    "",
    "no id",
  );
  assert.strictEqual(bareRegionName({id: "x"}), undefined, "a data row");
});

it("geomapTooltipConfig — titles a region with no data row by its name", () => {
  const viz = new Geomap().label(d => `${d.city}, ${d.region}`);
  viz._drawLabel = d => `${d.city}, ${d.region}`;
  viz._id = d => d.id;
  const {title} = geomapTooltipConfig(viz);
  const f = feature({name: "Beta Land"}, "beta");
  assert.strictEqual(title(f, 0, region(f)), "Beta Land");
  assert.strictEqual(
    title({id: "alpha", city: "Boston", region: "MA"}, 0),
    "Boston, MA",
    "a data row",
  );
});
