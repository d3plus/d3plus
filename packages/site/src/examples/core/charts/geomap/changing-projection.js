const config = {
  data: [],
  projection: "geoMercator",
  topojson: "/data/countries-110m.json",
  topojsonFilter: d => d.id !== "010",
};
