const esri = name =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/${name}/MapServer/tile/{z}/{y}/{x}`;

const noKeyTilesets = [
  {
    name: "Esri Light Gray (default)",
    url: esri("Canvas/World_Light_Gray_Base"),
  },
  {
    name: "Esri Dark Gray (dark default)",
    url: esri("Canvas/World_Dark_Gray_Base"),
  },
  {name: "Esri Terrain", url: esri("World_Terrain_Base")},
  {name: "Esri Street Map", url: esri("World_Street_Map")},
  {name: "Esri Imagery", url: esri("World_Imagery")},
  {name: "Esri National Geographic", url: esri("NatGeo_World_Map")},
  {name: "OSM Standard", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"},
  {
    name: "OSM Humanitarian",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  },
  {name: "OpenTopoMap", url: "https://tile.opentopomap.org/{z}/{x}/{y}.png"},
];

const config = {
  projection: "geoMercator",
  // The default, spelled out: any two tile servers can be paired this way.
  tileUrl: {
    light: noKeyTilesets[0].url,
    dark: noKeyTilesets[1].url,
  },
  ocean: {light: "#d0cfd4", dark: "#222327"},
};
