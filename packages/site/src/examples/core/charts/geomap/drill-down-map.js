// Population by county, rolled up to each state at the top level. One
// us-atlas file holds both levels: it is listed twice, with a key for each.
const config = {
  data: "/data/county-population.json",
  // Each county carries its state: the first two digits of its FIPS code.
  dataFormat: rows =>
    rows.map(d => ({
      ...d,
      county: d["County ID"].slice(7),
      state: d["County ID"].slice(7, 9),
      abbr: d.County.split(", ").pop(),
    })),
  groupBy: ["state", "county"],
  depth: 0,
  // A state's merged row lists its counties' names.
  label: d => (typeof d.County === "string" ? d.County : d.abbr),
  colorScale: "Population",
  ocean: "transparent",
  projection: "geoAlbersUsa",
  tiles: false,
  topojson: ["/data/counties-10m.json", "/data/counties-10m.json"],
  topojsonKey: ["states", "counties"],
};
