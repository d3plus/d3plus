const config = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Diabetes%20Prevalence&Year=2025",
  groupBy: "State ID",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {
    axisConfig: {
      tickFormat: d => `${(d * 100).toFixed(1)}%`,
    },
  },
  ocean: "transparent",
  projection: "geoAlbersUsa",
  tiles: false,
  topojson: "https://datausa.io/topojson/State.json",
};
