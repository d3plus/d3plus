const config = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Diabetes%20Prevalence&Year=2025",
  groupBy: "State ID",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {
    color: ["red", "orange", "yellow", "green", "blue"],
  },
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/State.json",
};
