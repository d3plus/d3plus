// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Geomap} from "../../../args/core/charts/Geomap.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Geomap",
  component: Geomap,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate points. See [this example](https://d3plus.org/examples/d3plus-geomap/getting-started/) for help getting started.",
      },
    },
  }
};

const Template = (args) => <Geomap config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const ChoroplethMap = Template.bind({});
ChoroplethMap.args = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Diabetes%20Prevalence&Year=2025",
  groupBy: "State ID",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {
    axisConfig: {
      tickFormat: funcify(
        d => `${(d * 100).toFixed(1)}%`,
        "d => `${(d * 100).toFixed(1)}%`"
      )
    }
  },
  ocean: "transparent",
  projection: "geoAlbersUsa",
  tiles: false,
  topojson: "https://datausa.io/topojson/State.json"
};
ChoroplethMap.parameters = {controls: {include: ["colorScale", "colorScaleConfig", "ocean", "projection", "tiles", "topojson"]}, docs: {description: {story: "Joins data to the `topojson` shapes via `groupBy` and fills each region by its `colorScale` value; `colorScaleConfig`'s `tickFormat` renders the legend ticks as percentages."}}};

export const CoordinatePointMap = Template.bind({});
CoordinatePointMap.args = {
  data: "/data/city_coords.json",
  groupBy: "slug",
  colorScale: "dma_code",
  label: funcify(
    d => d.city + ", " + d.region,
    `d => d.city + ", " + d.region`
  ),
  point: funcify(
    d => [d.longitude, d.latitude],
    "d => [d.longitude, d.latitude]"
  ),
  pointSize: funcify(
    d => d.dma_code,
    "d => d.dma_code"
  ),
  pointSizeMin: 1,
  pointSizeMax: 10
};
CoordinatePointMap.parameters = {controls: {include: ["point", "pointSize", "pointSizeMin", "pointSizeMax"]}, docs: {description: {story: "Rather than shading regions, this drops a marker per datum: `point` returns each row's `[longitude, latitude]`, and `pointSize` scales the radius between `pointSizeMin` and `pointSizeMax` by `dma_code`."}}};

export const ChangingProjection = Template.bind({});
ChangingProjection.args = {
  data: [],
  projection: "geoMercator",
  topojson: "https://oec.world/topojson/world-50m.json",
  topojsonFilter: funcify(
    d => d.id !== "ata",
    "d => d.id !== 'ata'"
  )
};
ChangingProjection.parameters = {controls: {include: ["projection", "topojson", "topojsonFilter"]}, docs: {description: {story: "Any d3-geo projection name can be passed to `projection`; `\"geoMercator\"` gives the familiar cylindrical world view, while `topojsonFilter` drops Antarctica (`id !== \"ata\"`)."}}};

// Tile servers that serve tiles without an account or API key (checked
// 2026-09-25). Each still has its own usage policy and attribution, which
// Geomap displays automatically.
const esri = name => `https://server.arcgisonline.com/ArcGIS/rest/services/${name}/MapServer/tile/{z}/{y}/{x}`;
const noKeyTilesets = [
  {name: "Esri Light Gray (default)", url: esri("Canvas/World_Light_Gray_Base")},
  {name: "Esri Dark Gray (dark default)", url: esri("Canvas/World_Dark_Gray_Base")},
  {name: "Esri Terrain", url: esri("World_Terrain_Base")},
  {name: "Esri Street Map", url: esri("World_Street_Map")},
  {name: "Esri Imagery", url: esri("World_Imagery")},
  {name: "Esri National Geographic", url: esri("NatGeo_World_Map")},
  {name: "OSM Standard", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"},
  {name: "OSM Humanitarian", url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"},
  {name: "OpenTopoMap", url: "https://tile.opentopomap.org/{z}/{x}/{y}.png"},
];

// No topojson layered on top here — these three stories are about the raw
// basemap tiles, so nothing but the ocean/tile imagery is drawn over them.
const tileBackdrop = {
  projection: "geoMercator"
};

export const ChangingTileset = {
  render: () => {
    const [tileUrl, setTileUrl] = React.useState(noKeyTilesets[0].url);
    return (
      <div>
        <select
          value={tileUrl}
          onChange={e => setTileUrl(e.target.value)}
          style={{marginBottom: "12px", font: "inherit", padding: "4px 8px"}}
        >
          {noKeyTilesets.map(({name, url}) => <option key={url} value={url}>{name}</option>)}
        </select>
        <Geomap config={{...tileBackdrop, height: 400, tileUrl}} />
      </div>
    );
  },
  parameters: {
    controls: {disable: true},
    docs: {
      description: {story: "Point `tileUrl` at any XYZ tile server to swap the background imagery — pick one of the servers that need no API key from the menu above the map. The credit in the corner updates to match, and any other `{z}/{x}/{y}` template works too (Esri's services order it `{z}/{y}/{x}`)."},
      source: {code: `import {Geomap} from "@d3plus/react";
import {useState} from "react";

function ChangingTileset() {
  const [tileUrl, setTileUrl] = useState("${noKeyTilesets[0].url}");
  return (
    <div>
      <select value={tileUrl} onChange={e => setTileUrl(e.target.value)}>
${noKeyTilesets.map(t => `        <option value="${t.url}">${t.name}</option>`).join("\n")}
      </select>
      <Geomap config={{tileUrl}} />
    </div>
  );
}`}
    }
  }
};

export const NoKeyTilesets = {
  render: () => (
    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px"}}>
      {noKeyTilesets.map(({name, url}) =>
        <div key={url} style={{height: "280px"}}>
          <Geomap config={{...tileBackdrop, height: 280, title: name, tileUrl: url}} />
        </div>
      )}
    </div>
  ),
  parameters: {
    controls: {disable: true},
    docs: {
      description: {story: "Every tile server that works without an account or API key, side by side. Esri's Canvas layers are the default: Light Gray on a light page and Dark Gray on a dark one. The others suit topographic, street-level, or imagery backdrops."},
      source: {code: `import {Geomap} from "@d3plus/react";

${noKeyTilesets.map(t => `// ${t.name}
<Geomap config={{tileUrl: "${t.url}"}} />`).join("\n\n")}`}
    }
  }
};

export const LightAndDarkTiles = {
  render: () => (
    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px"}}>
      {[["Light page", "#ffffff", "#222"], ["Dark page", "#15191e", "#ddd"]].map(([label, background, color]) =>
        <div key={label} style={{background, color, padding: "12px", borderRadius: "6px", height: "304px"}}>
          <Geomap config={{...tileBackdrop, height: 280, title: label, titleConfig: {fontColor: color}}} />
        </div>
      )}
    </div>
  ),
  parameters: {
    controls: {disable: true},
    docs: {
      description: {story: "`tileUrl` and `ocean` also accept a `{light, dark}` pair, and the defaults are one: Esri Light Gray Canvas on a light backdrop and Dark Gray Canvas on a dark one, with a matching ocean and no-data fill. Geomap reads the backdrop from the page (the nearest background color, or a dark `color-scheme` on a dark system) and redraws when it changes."},
      source: {code: `import {Geomap} from "@d3plus/react";

// The default, spelled out: any two tile servers can be paired this way.
<Geomap config={{
  tileUrl: {
    light: "${noKeyTilesets[0].url}",
    dark: "${noKeyTilesets[1].url}"
  },
  ocean: {light: "#d0cfd4", dark: "#222327"}
}} />`}
    }
  }
};

export const ChangingNoDataColor = Template.bind({});
ChangingNoDataColor.args = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=pums_5&drilldowns=PUMA&measures=Total%20Population&Year=2023",
  groupBy: "PUMA ID",
  colorScale: "Total Population",
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/PUMA.json",
  topojsonFill: "#ffcccc"
}
ChangingNoDataColor.parameters = {controls: {include: ["topojsonFill"]}, docs: {description: {story: "`topojsonFill` sets the color for shapes with no matching data (here light pink), so empty regions read differently from those on the `colorScale`."}}};

export const CustomColors = Template.bind({});
CustomColors.args = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Diabetes%20Prevalence&Year=2025",
  groupBy: "State ID",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {
    color: ["red", "orange", "yellow", "green", "blue"]
  },
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/State.json"
};
CustomColors.parameters = {controls: {include: ["colorScaleConfig"]}, docs: {description: {story: "Override the default color interpolation by passing an explicit ramp to `colorScaleConfig`'s `color` array — here red → orange → yellow → green → blue across the range."}}};

export const CustomZoom = Template.bind({});
CustomZoom.args = {
  fitObject: {
    "type": "Topology",
    "objects": {
      "custom-bounds": {
        "type": "GeometryCollection",
        "geometries":[
          {
            "type": "MultiPoint",
            "coordinates": [[-160, 70], [170, -55]]
          }
        ]
      }
    }
  }
};
CustomZoom.parameters = {controls: {include: ["fitObject"]}, docs: {description: {story: "`fitObject` frames the initial view to a custom TopoJSON object; the two `MultiPoint` corners here define the bounding box the map zooms to fit."}}};

export const DisableZooming = Template.bind({});
DisableZooming.args = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Diabetes%20Prevalence&Year=2025",
  groupBy: "State ID",
  colorScale: "Diabetes Prevalence",
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/State.json",
  zoom: false
};
DisableZooming.parameters = {controls: {include: ["zoom"]}, docs: {description: {story: "`zoom: false` turns off panning and scroll-to-zoom, locking the map at its initial extent."}}};

export const HidingTheColorScale = Template.bind({});
HidingTheColorScale.args = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Diabetes%20Prevalence&Year=2025",
  groupBy: "State ID",
  colorScale: "Diabetes Prevalence",
  colorScalePosition: false,
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/State.json"
};
HidingTheColorScale.parameters = {controls: {include: ["colorScalePosition"]}, docs: {description: {story: "`colorScalePosition: false` hides the legend while regions stay shaded by `colorScale` — useful when the scale is documented elsewhere."}}};

export const OverridingColorscaleBehavior = Template.bind({});
OverridingColorscaleBehavior.args = {
  data: "https://oec.world/olap-proxy/data?cube=trade_i_baci_a_92&Exporter+Country=eudeu&Year=2018,2019&drilldowns=Year,Importer+Country&locale=en&measures=Trade+Value&growth=Year,Trade+Value&parents=true&sparse=false&properties=Importer+Country+ISO+3",
  groupBy: "ISO 3",
  colorScale: "Trade Value Growth Value",
  colorScaleConfig: {
    scale: "linear"
  },
  projection: "geoMiller",
  topojson: "https://oec.world/topojson/world-50m.json",
  topojsonFilter: funcify(
    d => d.id !== "ata",
    "d => d.id !== 'ata'"
  )
};
OverridingColorscaleBehavior.parameters = {controls: {include: ["colorScaleConfig"]}, docs: {description: {story: "The color scale normally auto-detects its type from the data; setting `colorScaleConfig`'s `scale: \"linear\"` forces a plain linear ramp instead of the automatic choice."}}};

export const RemovingOceanAndTiles = Template.bind({});
RemovingOceanAndTiles.args = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Diabetes%20Prevalence&Year=2025",
  groupBy: "State ID",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {
    axisConfig: {
      tickFormat: funcify(
        d => `${(d * 100).toFixed(1)}%`,
        "d => `${(d * 100).toFixed(1)}%`"
      )
    }
  },
  ocean: "transparent",
  projection: "geoAlbersUsa",
  tiles: false,
  topojson: "https://datausa.io/topojson/State.json"
};
RemovingOceanAndTiles.parameters = {controls: {include: ["ocean", "tiles"]}, docs: {description: {story: "Set `ocean: \"transparent\"` and `tiles: false` to strip the water fill and background map tiles, leaving just the choropleth shapes."}}};

export const RenderingToCanvas = Template.bind({});
RenderingToCanvas.args = {
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Diabetes%20Prevalence&Year=2025",
  groupBy: "State ID",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {
    axisConfig: {
      tickFormat: funcify(
        d => `${(d * 100).toFixed(1)}%`,
        "d => `${(d * 100).toFixed(1)}%`"
      )
    }
  },
  ocean: "transparent",
  projection: "geoAlbersUsa",
  renderer: "canvas",
  tiles: false,
  topojson: "https://datausa.io/topojson/State.json"
};
RenderingToCanvas.parameters = {
  controls: {include: ["renderer"]},
  docs: {description: {story: "The same choropleth painted with the Canvas backend (`renderer: \"canvas\"`). Geography, color scale, tooltips, and zoom all work; SVG remains the default."}}
};

export const PointMotionTrails = Template.bind({});
PointMotionTrails.args = {
  data: [
    {id: "Ana",  day: 1, lon: -38, lat: 11},
    {id: "Ana",  day: 2, lon: -47, lat: 14},
    {id: "Ana",  day: 3, lon: -56, lat: 17},
    {id: "Ana",  day: 4, lon: -65, lat: 21},
    {id: "Ana",  day: 5, lon: -73, lat: 25},
    {id: "Ana",  day: 6, lon: -81, lat: 29},
    {id: "Bill", day: 1, lon: -30, lat: 9},
    {id: "Bill", day: 2, lon: -39, lat: 13},
    {id: "Bill", day: 3, lon: -47, lat: 18},
    {id: "Bill", day: 4, lon: -54, lat: 24},
    {id: "Bill", day: 5, lon: -61, lat: 30},
    {id: "Bill", day: 6, lon: -69, lat: 36}
  ],
  groupBy: "id",
  time: "day",
  point: funcify(
    d => [d.lon, d.lat],
    "d => [d.lon, d.lat]"
  ),
  pointSize: 8,
  projection: "geoMercator",
  topojson: "https://oec.world/topojson/world-50m.json",
  topojsonFilter: funcify(
    d => d.id !== "ata",
    "d => d.id !== 'ata'"
  ),
  fitObject: {
    type: "Topology",
    objects: {
      bounds: {
        type: "GeometryCollection",
        geometries: [
          {type: "MultiPoint", coordinates: [[-95, 5], [-12, 46]]}
        ]
      }
    }
  }
};
PointMotionTrails.parameters = {
  controls: {include: ["renderer", "time"]},
  docs: {description: {story: "Motion trails aren't just for scatter plots — Geomap coordinate points trail too, and are **on by default**. Press **play**: each storm track sweeps a tapering cone from its previous position to the next as the timeline advances, tracing its path across the map. Toggle `renderer` to compare the SVG and Canvas backends."}}
};
