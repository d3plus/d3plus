interface TileAttribution {
  matches: string[];
  text: string;
}

const tileAttributions: TileAttribution[] = [
  {
    matches: ["cartodb", "cartocdn"],
    text: "© <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors, © <a href='https://carto.com/attribution' target='_blank'>CARTO</a>",
  },
  {
    matches: ["tile.openstreetmap.org"],
    text: "© <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
  },
  {
    matches: ["openstreetmap.fr/hot"],
    text: "© <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors, tiles by <a href='https://www.hotosm.org/' target='_blank'>Humanitarian OpenStreetMap Team</a>",
  },
  {
    matches: ["stadiamaps.com"],
    text: "© <a href='https://stadiamaps.com/' target='_blank'>Stadia Maps</a> © <a href='https://openmaptiles.org/' target='_blank'>OpenMapTiles</a> © <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
  },
  {
    matches: ["opentopomap.org"],
    text: "© <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
  },
  {
    // Esri's Canvas basemaps (the default); their service credits, plus Esri's own.
    matches: ["World_Light_Gray_Base", "World_Dark_Gray_Base"],
    text: "Powered by <a href='https://www.esri.com/' target='_blank'>Esri</a> | Esri, HERE, Garmin, © <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors, and the GIS user community",
  },
  {
    matches: ["arcgisonline.com"],
    text: "Powered by <a href='https://developers.arcgis.com/terms/attribution/' target='_blank'>Esri</a>",
  },
  {
    matches: ["/watercolor/"],
    text: "Map tiles by <a href='http://stamen.com' target='_blank'>Stamen Design</a>, under <a href='http://creativecommons.org/licenses/by/3.0' target='_blank'>CC BY 3.0</a>. Data by <a href='http://openstreetmap.org' target='_blank'>OpenStreetMap</a>, under <a href='http://www.openstreetmap.org/copyright' target='_blank'>ODbL</a>.",
  },
  {
    matches: ["stamen-tiles", "stamen.com"],
    text: "Map tiles by <a href='http://stamen.com' target='_blank'>Stamen Design</a>, under <a href='http://creativecommons.org/licenses/by/3.0' target='_blank'>CC BY 3.0</a>. Data by <a href='http://openstreetmap.org' target='_blank'>OpenStreetMap</a>, under <a href='http://creativecommons.org/licenses/by-sa/3.0' target='_blank'>CC BY SA</a>.",
  },
];

export default tileAttributions;
