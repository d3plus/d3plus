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

export const ChangingTileset = Template.bind({});
ChangingTileset.args = {
  tileUrl: "https://tile.opentopomap.org/{z}/{x}/{y}.png"
}
ChangingTileset.parameters = {controls: {include: ["tileUrl"]}, docs: {description: {story: "Point `tileUrl` at a different XYZ tile server (here OpenTopoMap) to swap the background imagery — handy for topographic or otherwise custom basemaps."}}};

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
