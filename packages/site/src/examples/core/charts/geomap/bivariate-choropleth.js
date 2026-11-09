const config = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Adult%20Obesity,Physical%20Inactivity&Year=2025",
  groupBy: "State ID",
  label: d => d.State,
  colorScale: ["Adult Obesity", "Physical Inactivity"],
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
