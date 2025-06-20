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
  data: "https://datausa.io/api/data?measure=Diabetes%20Prevalence&drilldowns=State&Year=2021",
  groupBy: "ID State",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {
    axisConfig: {
      tickFormat: funcify(
        d => `${(d * 100).toFixed(1)}%`,
        "d => `${(d * 100).toFixed(1)}%`"
      )
    }
  },
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/State.json"
};
ChoroplethMap.parameters = {controls: {include: ["colorScale", "colorScaleConfig", "projection", "topojson"]}};

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
CoordinatePointMap.parameters = {controls: {include: ["point", "pointSize", "pointSizeMin", "pointSizeMax"]}};

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
ChangingProjection.parameters = {controls: {include: ["projection", "topojson", "topojsonFilter"]}};

export const ChangingTileset = Template.bind({});
ChangingTileset.args = {
  tileUrl: "https://tile.opentopomap.org/{z}/{x}/{y}.png"
}
ChangingTileset.parameters = {controls: {include: ["tileUrl"]}};

export const ChangingNoDataColor = Template.bind({});
ChangingNoDataColor.args = {
  data: "https://datausa.io/api/data?PUMS%20Industry=481&drilldowns=PUMA&measure=Total%20Population,ygipop%20RCA,Record%20Count&Record%20Count>=5",
  groupBy: "ID PUMA",
  colorScale: "Total Population",
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/Puma.json",
  topojsonFill: "#ffcccc"
}
ChangingNoDataColor.parameters = {controls: {include: ["topojsonFill"]}};

export const CustomColors = Template.bind({});
CustomColors.args = {
  data: "https://datausa.io/api/data?measure=Diabetes%20Prevalence&drilldowns=State&Year=2021",
  groupBy: "ID State",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {
    color: ["red", "orange", "yellow", "green", "blue"]
  },
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/State.json"
};
CustomColors.parameters = {controls: {include: ["colorScaleConfig"]}};

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
CustomZoom.parameters = {controls: {include: ["fitObject"]}};

export const DisableZooming = Template.bind({});
DisableZooming.args = {
  data: "https://datausa.io/api/data?measure=Diabetes%20Prevalence&drilldowns=State&Year=2021",
  groupBy: "ID State",
  colorScale: "Diabetes Prevalence",
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/State.json",
  zoom: false
};
DisableZooming.parameters = {controls: {include: ["zoom"]}};

export const HiddingTheColorScale = Template.bind({});
HiddingTheColorScale.args = {
  data: "https://datausa.io/api/data?measure=Diabetes%20Prevalence&drilldowns=State&Year=2021",
  groupBy: "ID State",
  colorScale: "Diabetes Prevalence",
  colorScalePosition: false,
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/State.json"
};
HiddingTheColorScale.parameters = {controls: {include: ["colorScalePosition"]}};

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
OverridingColorscaleBehavior.parameters = {controls: {include: ["colorScaleConfig"]}};

export const RemovingOceanAndTiles = Template.bind({});
RemovingOceanAndTiles.args = {
  data: "https://datausa.io/api/data?measure=Diabetes%20Prevalence&drilldowns=State&Year=2021",
  groupBy: "ID State",
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
RemovingOceanAndTiles.parameters = {controls: {include: ["ocean", "tiles"]}};
