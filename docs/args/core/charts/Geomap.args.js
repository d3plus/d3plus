import React from "react";
import Viz from "./Viz.args";
import { assign } from "@d3plus/dom";
import * as projections from "d3-geo-projection";

import { Geomap as D3plusGeomap } from "@d3plus/react";

const excludedKeys = [
  "geoArmadillo",
  "geoBerghaus",
  "geoChamberlin",
  "geoGingery",
  "geoHammerRetroazimuthal",
  "geoHealpix",
  "geoModifiedStereographic",
  "geoTwoPointAzimuthal",
  "geoInterrupt",
  "geoInterruptedHomolosine",
  "geoInterruptedSinusoidal",
  "geoInterruptedBoggs",
  "geoInterruptedSinuMollweide",
  "geoInterruptedMollweide",
  "geoInterruptedMollweideHemispheres",
  "geoInterruptedQuarticAuthalic",
  "geoPolyhedral",
  "geoProject",
  "geoQuantize",
  "geoQuincuncial",
  "geoStitch",
  "geoTwoPointEquidistant",
  "conicConformalFrance",
  "conicConformalPortugal",
  "conicConformalSpain",
  "onicConformalEurope",
  "conicEquidistantJapan",
  "mercatorEcuador",
  "transverseMercatorChile"
];

const projectionOptions = Object.keys(projections).filter(d => (!d.includes("Raw")) && (!excludedKeys.includes(d)));

export const Geomap = ({ config }) => <D3plusGeomap config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Geomap
   */
  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete|shape.*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Geomap-specific methods
   */
  {
    fitFilter: {
      type: {
        summary: "number | string | array | function"
      },
      defaultValue: undefined,
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      control: { type: "array" },
      description: `Allows removing specific geographies from topojson file to improve zooming determitation.`
    },
    fitKey: {
      type: {
        summary: "string"
      },
      defaultValue: undefined,
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      control: { type: "text" },
      description: `Sets the identificator key to be used for the zoom fit.
If not specified, the first key in the array returned from \`Object.keys\` on the topojson will be used.`
    },
    fitObject: {
      type: {
        summary: "object | string | function"
      },
      defaultValue: false,
      table: {
        defaultValue: {
          summary: false
        }
      },
      control: { type: null },
      description: `The topojson to be used for the initial projection.
The value passed should either be a valid Topojson object or a string representing a filepath or URL to be loaded.
Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function needs to return the final topojson object.
      `
    },
    ocean: {
      type: {
        summary: "string"
      },
      defaultValue: "#d4dadc",
      table: {
        defaultValue: {
          summary: "#d4dadc"
        }
      },
      control: { type: "text" },
      description: `Defines the color visible behind any shapes drawn on the map projection.`
    },
    point: {
      type: {
        summary: "function | array"
      },
      defaultValue: d => d.point,
      table: {
        defaultValue: {
          summary: d => d.point
        }
      },
      control: { type: null },
      description: `Sets the accessor to be used when detecting coordinate points in the objects passed to the data. Values are expected to be in the format \`[longitude, latitude]\`.`
    },
    pointSize: {
      type: {
        summary: "number | function"
      },
      defaultValue: 1,
      table: {
        defaultValue: {
          summary: 1
        }
      },
      control: { type: "number" },
      description: `Sets the accessor or static value to be used for sizing coordinate points`
    },
    pointSizeMax: {
      type: {
        summary: "number"
      },
      defaultValue: 10,
      table: {
        defaultValue: {
          summary: 10
        }
      },
      control: { type: "number" },
      description: `Sets the maximum pixel radius used in the scale for sizing coordinate points`
    },
    pointSizeMin: {
      type: {
        summary: "number"
      },
      defaultValue: 5,
      table: {
        defaultValue: {
          summary: 5
        }
      },
      control: { type: "number" },
      description: `Sets the minimum pixel radius used in the scale for sizing coordinate points`
    },
    projection: {
      type: {
        summary: "string | function"
      },
      defaultValue: "geoMercator",
      table: {
        defaultValue: {
          summary: "geoMercator"
        }
      },
      control: {
        type: "select",
        options: projectionOptions
      },
      description: `Sets the map projection used when displaying topojson and coordinate points.
      All of the projections exported from [d3-geo](https://github.com/d3/d3-geo#projections), [d3-geo-projection](https://github.com/d3/d3-geo-projection#api-reference), and [d3-composite-projections](http://geoexamples.com/d3-composite-projections/) are accepted, whether as the string name (ie. "geoMercator") or the generator function itself.`
    },
    projectionPadding: {
      type: {
        summary: "number | string"
      },
      defaultValue: 20,
      table: {
        defaultValue: {
          summary: 20
        }
      },
      control: { type: "number" },
      description: `Sets the outer padding between the edge of the visualization and the shapes drawn.
The value passed can be either a single number to be used on all sides, or a CSS string pattern (ie. \`"20px 0 10px"\`).`
    },
    projectionRotate: {
      type: {
        summary: "array"
      } ,
      defaultValue: [0, 0],
      table: {
        defaultValue: {
          summary: [0, 0]
        }
      },
      control: { type: "array" },
      description: `Sets the value passed to the projection's rotate function used to shift the centerpoint of a map.`
    },
    tiles: {
      type: {
        summary: "boolean"
      } ,
      defaultValue: true,
      table: {
        defaultValue: {
          summary: true
        }
      },
      control: { type: "boolean" },
      description: `Toggles the visibility of the map tiles.`
    },
    tileUrl: {
      type: {
        summary: "string"
      } ,
      defaultValue: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png",
      table: {
        defaultValue: {
          summary: "string",
          detail: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png"
        }
      },
      control: { type: "text" },
      description: `Changes the base URL used for fetching the tiles, as long as the string passed contains \`{x}\`, \`{y}\`, and \`{z}\` variables enclosed in curly brackets for the zoom logic to load the correct tiles.
By default, d3plus uses the \`light_all\` style provided by [CARTO](https://carto.com/location-data-services/basemaps/)`
    },
    topojson: {
      type: {
        summary: "object | string | function"
      } ,
      defaultValue: false,
      table: {
        defaultValue: {
          summary: false
        }
      },
      control: { type: "text" },
      description: `Sets the topojson to be used for drawing geographical paths. The value passed should either be a valid topojson object or a string representing a filepath or URL to be loaded.
Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final Topojson obejct.`
    },
    topojsonFill: {
      type: {
        summary: "string | function"
      },
      defaultValue: "#f5f5f3",
      table: {
        defaultValue: {
          summary: "f5f5f3"
        }
      },
      control: { type: "text" },
      description: `The function to be used to set default color of the map.`
    },
    topojsonFilter: {
      type: {
        summary: "number | string | array | function"
      },
      defaultValue: d => !["010"].includes(d.id),
      table: {
        defaultValue: {
          summary: "function",
          detail: `d => !["010"].includes(d.id)`
        }
      },
      control: { type: "array" },
      description: `Allows removing specific boundaries from the topojson file.
The *value* passed can be a single id to remove, an array of ids, or a filter function.
`
    },
    topojsonKey: {
      type: {
        summary: "string"
      },
      defaultValue: "id",
      table: {
        defaultValue: {
          summary: false
        }
      },
      control: { type: "text" },
      description: `If the topojson contains multiple geographical sets (for example, a file containing state and county boundaries), use this method to indentify which set to use.
If not specified, the first key in the array returned from using \`Object.keys\` on the topojson will be used.
      `
    },
    topojsonId: {
      type: {
        summary: "string | function"
      },
      defaultValue: "id",
      table: {
        defaultValue: {
          summary: "function",
          detail: `d => d.id`
        }
      },
      control: { type: null},
      description: `Sets the accessor used to map each topojson geometry to it's corresponding data`
    }
  }
);
