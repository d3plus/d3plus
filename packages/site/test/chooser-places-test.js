import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {codeSource} from "../src/components/ChartChooser/code.ts";
import {profileData} from "../src/components/ChartChooser/columns.ts";
import {parseData} from "../src/components/ChartChooser/parse.ts";
import {
  geomapPlan,
  tileGridPlan,
} from "../src/components/ChartChooser/places.ts";
import {analyze} from "../src/components/ChartChooser/traits.ts";
import {evaluate} from "../src/components/Playground/evaluate.ts";

const traits = text => analyze(profileData(parseData(text).rows));
/** A plan's config, run as the playground runs it. */
const run = (plan, t) => evaluate(codeSource(t.rows, plan)).config;

describe("geomapPlan", () => {
  it("maps countries' ISO numeric ids to the data's alpha-3 codes", () => {
    const t = traits("iso,country,share\nUSA,United States,21\nBRA,Brazil,89");
    const c = run(geomapPlan(t), t);
    assert.equal(c.groupBy, "iso");
    assert.equal(c.topojson, "/data/countries-110m.json");
    assert.equal(c.topojsonId({id: "076"}), "BRA");
    assert.equal(c.topojsonId({id: "004"}), undefined);
    assert.equal(c.label({country: "Brazil"}), "Brazil");
    assert.equal(c.colorScale, "share");
  });
  it("matches US states by FIPS code, name, or postal code", () => {
    const fips = traits("state,v\n06,1\n48,2");
    const byFips = run(geomapPlan(fips), fips);
    assert.equal(byFips.topojson, "/data/states-10m.json");
    assert.equal(byFips.projection, "geoAlbersUsa");
    assert.equal(byFips.topojsonId, undefined);

    const names = traits("state,v\nCalifornia,1\nTexas,2");
    const byName = run(geomapPlan(names), names);
    assert.equal(byName.topojsonId({properties: {name: "Texas"}}), "Texas");

    const postal = traits("state,v\nCA,1\nTX,2");
    const byPostal = run(geomapPlan(postal), postal);
    assert.equal(byPostal.topojsonId({id: "48"}), "TX");
  });
  it("draws coordinates as points, on the states map when every point is in the US", () => {
    const us = traits(
      "city,lat,lon,n\nBoston,42.4,-71.1,3\nDenver,39.7,-105,2",
    );
    const c = run(geomapPlan(us), us);
    assert.deepEqual(c.point({lat: 1, lon: 2}), [2, 1]);
    assert.equal(c.pointSize({n: 3}), 3);
    assert.equal(c.groupBy, "city");
    assert.equal(c.topojson, "/data/states-10m.json");

    const world = traits("lat,lon\n48.9,2.3\n-33.9,151.2");
    const w = run(geomapPlan(world), world);
    assert.equal(w.topojson, "/data/countries-110m.json");
    assert.equal(w.groupBy({}, 1), 1);
  });
});

describe("tileGridPlan", () => {
  it("groups by postal or FIPS codes directly", () => {
    const t = traits("state,v\nCA,1\nTX,2");
    const c = run(tileGridPlan(t), t);
    assert.equal(c.groupBy, "state");
    assert.equal(c.colorScale, "v");
  });
  it("maps state names to postal codes", () => {
    const t = traits("state,v\nCalifornia,1\nTexas,2");
    const c = run(tileGridPlan(t), t);
    assert.equal(c.groupBy({state: "Texas"}), "TX");
    assert.equal(c.label({state: "Texas"}), "Texas");
  });
});
