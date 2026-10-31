const config = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Diabetes%20Prevalence&Year=2025",
  groupBy: "State ID",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {scale: "linear"},
  colorScalePosition: "left",
  projection: "geoAlbersUsa",
  tableView: true,
  topojson: "https://datausa.io/topojson/State.json",
};
