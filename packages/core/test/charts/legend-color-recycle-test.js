import assert from "assert";

import {buildLegendData} from "../../es/src/charts/features/featuresLegend.js";

/**
    Regression guard for #788 ("Legend gets scrambled if we run out of colors").

    The legend used to roll its entries up by the *resolved* paint string
    (fill+opacity+texture). Once a chart had more categories than the ordinal
    color scale has colors, the scale recycled a hex across two distinct
    categories, their paint strings collided, and `rollup` merged them into a
    single scrambled entry (illegible label + hover/hide that hit both).

    The fix keys legend entries on the color *encoding* input (`schema.color`)
    instead, so recycled hues no longer merge — while opacity/texture still
    split entries, and an intentional coarse color (many groups sharing one
    color-key) still collapses to one entry.
*/

// A 16-slot palette (the default scale length). Groups past slot 16 recycle.
const PALETTE = Array.from(
  {length: 16},
  (_, i) => `#${(i + 1).toString(16).padStart(6, "0")}`,
);

function fakeViz(overrides) {
  const base = {
    _drawDepth: 0,
    _ids: d => [d.group],
    schema: {
      aggs: {},
      colorScale: false,
      color: d => d.group,
      shape: () => "Rect",
      shapeConfig: {opacity: 1, texture: false},
      legendSort: (a, b) => String(a.group).localeCompare(String(b.group)),
    },
  };
  return {
    ...base,
    ...overrides,
    schema: {...base.schema, ...(overrides && overrides.schema)},
  };
}

it("keeps one legend entry per category when colors are recycled (#788)", () => {
  const groupCount = 18; // > PALETTE.length, so g16/g17 reuse g0/g1's hex
  const legendData = Array.from({length: groupCount}, (_, i) => ({
    id: `g${i}`,
    group: `g${i}`,
  }));
  const viz = fakeViz({
    _legendData: legendData,
    schema: {
      // resolved fill recycles the palette — the exact #788 condition
      shapeConfig: {
        fill: d => PALETTE[Number(d.group.slice(1)) % PALETTE.length],
        opacity: 1,
        texture: false,
      },
    },
  });

  const {legendData: out, legendKey} = buildLegendData(viz);

  assert.strictEqual(out.length, groupCount, "one legend entry per category");

  // The colliding pairs (g0/g16 and g1/g17 share a hex) must stay separate.
  const groups = out.map(d => d.group);
  for (const g of ["g0", "g16", "g1", "g17"]) {
    assert.ok(groups.includes(g), `${g} kept its own entry`);
    assert.strictEqual(
      typeof out.find(d => d.group === g).group,
      "string",
      `${g} was not merged into a multi-value entry`,
    );
  }

  // Every entry resolves to a unique legend key.
  const keys = new Set(out.map((d, i) => legendKey(d, i)));
  assert.strictEqual(keys.size, groupCount, "legend keys are unique per entry");
});

it("collapses groups that intentionally share a color key into one entry", () => {
  // Coarse coloring: color by continent while drawing at the country level.
  const countries = [
    {id: "US", continent: "NA"},
    {id: "CA", continent: "NA"},
    {id: "FR", continent: "EU"},
    {id: "DE", continent: "EU"},
    {id: "BR", continent: "SA"},
  ];
  const viz = fakeViz({
    _legendData: countries,
    _drawDepth: 1,
    _ids: d => [d.continent, d.id],
    schema: {
      color: d => d.continent,
      shapeConfig: {
        fill: d => ({NA: "#111111", EU: "#222222", SA: "#333333"})[d.continent],
        opacity: 1,
        texture: false,
      },
      legendSort: (a, b) =>
        String(a.continent).localeCompare(String(b.continent)),
    },
  });

  const {legendData: out} = buildLegendData(viz);

  assert.strictEqual(out.length, 3, "one entry per shared color key (continent)");
  const continents = out.map(d => d.continent).sort();
  assert.deepStrictEqual(continents, ["EU", "NA", "SA"], "grouped by continent");
});

it("still splits entries that differ only by opacity", () => {
  // Force a single color key so only opacity can distinguish entries.
  const rows = [
    {id: "a", group: "g", level: 1},
    {id: "b", group: "g", level: 0.5},
  ];
  const viz = fakeViz({
    _legendData: rows,
    schema: {
      color: () => "shared",
      shapeConfig: {
        fill: () => "#123456",
        opacity: d => d.level,
        texture: false,
      },
    },
  });

  const {legendData: out} = buildLegendData(viz);

  assert.strictEqual(out.length, 2, "opacity remains a secondary splitter");
});
