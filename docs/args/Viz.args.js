import BaseClass from "./BaseClass.args";
import {Viz} from "d3plus-viz";
const SampleViz = new Viz();

export default {
  argTypes: {
    data: {
      type: {
        summary: "string | object[] | string[]",
        required: true
      },
      table: {
        defaultValue: {
          summary: "[]",
        }
      },
      description: `Sets the primary data array to be used when drawing the visualization. The value passed should be an *Array* of objects or a *String* representing a filepath or URL to be loaded. The following filetypes are supported: \`csv\`, \`tsv\`, \`txt\`, and \`json\`.

If your data URL needs specific headers to be set, an Object with "url" and "headers" keys may also be passed.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final array of obejcts to be used as the primary data array. For example, some JSON APIs return the headers split from the data values to save bandwidth. These would need be joined using a custom formatter.

If you would like to specify certain configuration options based on the yet-to-be-loaded data, you can also return a full \`config\` object from the data formatter (including the new \`data\` array as a key in the object).`
    },
    depth: {
      type: {summary: "number"},
      table: {
        defaultValue: {
          summary: "undefined",
          detail: "groupBy.length - 1"
        }
      },
      control: {type: "number"},
      description: `The array index value that corresponds with the desired visible groupBy array index.

Primarily used in nested visualizations when wanting to initialize as a parent group (depth \`0\`) and then allow the default click events to dig into the nested data structure.`
    },
    discrete: {
      type: {summary: "string | false"},
      table: {
        defaultValue: {summary: "false"}
      },
      control: {type: "number"},
      description: `Any axis that should be treated as discrete, meaning data points will not be aggregated across the variable used for this axis.`
    },
    groupBy: {
      type: {
        summary: "string | function | string[] | function[]",
        required: true
      },
      table: {
        defaultValue: {
          summary: "\"id\"",
          detail: `[d => d.id]`
        }
      },
      control: {type: "object"},
      description: `The unique key in each data point to use when grouping the data.

When passing a \`string\`, the value will be used in an accessor function to grab that key (ie. \`d => d[string]\`)

For visualizations with multiple hierarchies of data present, the function accepts an array of \`string\` and \`function\` values to determine each depth of nesting.`
    },
    height: {
      type: {summary: "number | false"},
      table: {
        defaultValue: {
          summary: "false",
          detail: "Auto-Detect Container Height"
        }
      },
      control: {type: "number"},
      description: `The pixel height of the visualization.

By default, or if \`false\` is passed, the height will be calculated automatically by measuring the parent DOM element.`
    },
    width: {
      type: {summary: "number | false"},
      table: {
        defaultValue: {
          summary: "false",
          detail: "Auto-Detect Container Width"
        }
      },
      control: {type: "number"},
      description: `The pixel width of the visualization.

By default, or if \`false\` is passed, the width will be calculated automatically by measuring the parent DOM element.`
    },

    /**
     * category: Shapes
     */
    color: {
      type: {summary: "string | function"},
      table: {
        category: "Shapes",
        defaultValue: {
          summary: "function",
          detail: `function(d, i) {
  return this._groupBy[0](d, i);
}`
        }
      },
      control: {type: "text"},
      description: `Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.`
    },
    colorScale: {
      type: {summary: "string | function | false"},
      table: {
        category: "Shapes",
        defaultValue: {summary: "false"}
      },
      control: {type: "text"},
      description: `Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point.

Setting to \`false\` disables the color scale behavior entirely, reverting back to the \`color\` method.`
    },
    dataCutoff: {
      type: {summary: "number"},
      defaultValue: SampleViz.dataCutoff(),
      table: {
        category: "Shapes",
        defaultValue: {summary: SampleViz.dataCutoff()}
      },
      control: {type: "number"},
      description: `If the number of visible data points exceeds this number, the default hover behavior will be disabled (helpful for very large visualizations slowing down the DOM with opacity updates).`
    },
    hiddenColor: {
      type: {summary: "string | function"},
      defaultValue: SampleViz.hiddenColor()(),
      table: {
        category: "Shapes",
        defaultValue: {summary: `\"${SampleViz.hiddenColor()()}\"`}
      },
      control: {type: "color"},
      description: `The color to be applied to Shapes in a "hidden" state, usually caused by legend filtering.`
    },
    hiddenOpacity: {
      type: {summary: "number | function"},
      defaultValue: SampleViz.hiddenOpacity()(),
      table: {
        category: "Shapes",
        defaultValue: {summary: SampleViz.hiddenOpacity()()}
      },
      control: {type: "range", min: 0, max: 1, step: 0.1},
      description: `The opacity to be applied to Shapes in a "hidden" state, usually caused by legend filtering.`
    },
    shape: {
      type: {summary: "string | function"},
      table: {
        category: "Shapes",
        defaultValue: {summary: "\"Rect\""}
      },
      control: {type: "text"},
      description: `The corresponding Shape class to use for drawing data in the visualization.`
    },
    shapeConfig: {
      type: {summary: "object"},
      table: {
        category: "Shapes",
        defaultValue: {
          summary: "object",
          detail: `import {color} from "d3-color";
import {colorAssign, colorContrast} from "d3plus-color";

{
  ariaLabel(d, i) {
    return this._drawLabel(d, i);
  },
  fill(d, i) {
    while (d.__d3plus__ && d.data) {
      d = d.data;
      i = d.i;
    }
    if (this._colorScale) {
      const c = this._colorScale(d, i);
      if (c !== undefined && c !== null) {
        const scale = this._colorScaleClass._colorScale;
        const colors = this._colorScaleClass.color();
        if (!scale) return colors instanceof Array ? colors[colors.length - 1] : colors;
        else if (!scale.domain().length) return scale.range()[scale.range().length - 1];
        return scale(c);
      }
    }
    const c = this._color(d, i);
    if (color(c)) return c;
    return colorAssign(c);
  },
  labelConfig: {
    fontColor(d, i) {
      const c = typeof this._shapeConfig.fill === "function"
        ? this._shapeConfig.fill(d, i) : this._shapeConfig.fill;
      return colorContrast(c);
    }
  },
  opacity: 1,
  role: "presentation",
  stroke(d, i) {
    const c = typeof this._shapeConfig.fill === "function"
      ? this._shapeConfig.fill(d, i) : this._shapeConfig.fill;
    return color(c).darker();
  },
  strokeWidth: 0
}`
        }
      },
      control: {type: "object"},
      description: `A Shape config that is used for rendering the primary shapes that represent each data point.`
    },

    /**
     * category: Legends
     */
    colorScaleConfig: {
      type: {summary: "object"},
      defaultValue: SampleViz.colorScaleConfig(),
      table: {
        category: "Legends",
        defaultValue: {
          summary: "object",
          detail: JSON.stringify(SampleViz.colorScaleConfig(), null, 2)}
      },
      control: {type: "object"},
      description: `A ColorScale config that is used for rendering the color scale legend.`
    },
    colorScaleMaxSize: {
      type: {summary: "string | function | false"},
      defaultValue: SampleViz.colorScaleMaxSize(),
      table: {
        category: "Legends",
        defaultValue: {summary: SampleViz.colorScaleMaxSize()}
      },
      control: {type: "number"},
      description: `Sets the maximum pixel size for drawing the color scale: width for horizontal scales and height for vertical scales.`
    },
    colorScalePadding: {
      type: {summary: "boolean | function"},
      defaultValue: true,
      table: {
        category: "Legends",
        defaultValue: {
          summary: "function",
          detail: `() => typeof window !== "undefined"
  ? window.innerWidth > 600
  : true`
        }
      },
      control: {type: "boolean"},
      description: `Tells the color scale whether or not to use the internal padding defined by the visualization in it’s positioning. For example, d3plus-plot will add padding on the left so that the color scale appears centered above the x-axis.

By default, this padding is only applied on screens larger than 600 pixels wide.`
    },
    colorScalePosition: {
      type: {summary: "string | function | false"},
      table: {
        category: "Legends",
        defaultValue: {
          summary: "function",
          detail: `function() {
  return this._width > this._height ? "right" : "bottom";
}`
        }
      },
      control: {
        type: "select",
        options: ["top", "right", "bottom", "left", false]
      },
      description: `Determines where the color scale should be positioned in relation to the main visualization.

The default behavior shows the color scale on the "right" when the width/height aspect ratio of the visualization is landscape (> 1), and at the "bottom" when in portrait (< 1).

Passing the Boolean \`false\` will disable the color scale from being displayed.`
    },
    legend: {
      type: {summary: "boolean | function"},
      defaultValue: true,
      table: {
        category: "Legends",
        defaultValue: {
          summary: "function",
          detail: `import {max} from "d3-array";

function(config, arr) {
  const maxGrouped = max(arr, (d, i) => {
    const id = this._groupBy[this._legendDepth].bind(this)(d, i);
    return id instanceof Array ? id.length : 1;
  });
  return arr.length > 1 && maxGrouped <= 2;
}`
        }
      },
      control: {type: "boolean"},
      description: `Determines the visibility of the color legend. Value can either be a \`boolean\` or a \`function\` that is provided the viz config and data array as it's 2 arguments.

  By default, the color legend is only shown when the number of colors used does not match the number of shapes shown in the visualization, as the shapes are usually labelled themselves in a 1-to-1 match.`
    },
    legendConfig: {
      type: {summary: "object"},
      table: {
        category: "Legends",
        defaultValue: {
          summary: "object",
          detail: `{
  label(d, i) {
    return this._drawLabel(d, i, this._legendDepth);
  },
  shapeConfig: {
    ariaLabel(d, i) {
      return this._drawLabel(d, i, this._legendDepth);
    },
    labelConfig: {
      fontColor: undefined,
      fontResize: false,
      padding: 0
    }
  }
}`}
      },
      control: {type: "object"},
      description: `A Legend config that is used for rendering the color legend.`
    },
    legendFilterInvert: {
      type: {summary: "boolean | function"},
      defaultValue: false,
      table: {
        category: "Legends",
        defaultValue: {summary: "false"}
      },
      control: {type: "boolean"},
      description: `Defines the click functionality of categorical legend squares.

When set to false, clicking will hide that category and shift+clicking will solo that category.

When set to true, clicking with solo that category and shift+clicking will hide that category.`
    },
    legendPadding: {
      type: {summary: "boolean | function"},
      defaultValue: true,
      table: {
        category: "Legends",
        defaultValue: {
          summary: "function",
          detail: `() => typeof window !== "undefined"
  ? window.innerWidth > 600
  : true`
        }
      },
      control: {type: "boolean"},
      description: `Tells the legend whether or not to use the internal padding defined by the visualization in it’s positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered above the x-axis.

By default, this padding is only applied on screens larger than 600 pixels wide.`
    },
    legendPosition: {
      type: {summary: "string | function | false"},
      table: {
        category: "Legends",
        defaultValue: {
          summary: "function",
          detail: `function() {
  return this._width > this._height ? "right" : "bottom";
}`
        }
      },
      control: {
        type: "select",
        options: ["top", "right", "bottom", "left", false]
      },
      description: `Determines where the color legend should be positioned in relation to the main visualization.

The default behavior shows the legend on the "right" when the width/height aspect ratio of the visualization is landscape (> 1), and at the "bottom" when in portrait (< 1).

Passing the Boolean \`false\` will disable the legend from being displayed.`
    },
    legendSort: {
      type: {
        summary: "function"
      },
      table: {
        category: "Legends",
        defaultValue: {
          summary: "function",
          detail: `function(a, b) {
  return this._drawLabel(a).localeCompare(this._drawLabel(b));
}`
        }
      },
      control: {type: null},
      description: `A JavaScript [sort comparator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) used to sort the data Array provided to the Legend class.
      `
    },
    legendTooltip: {
      type: {summary: "object"},
      table: {
        category: "Legends",
        defaultValue: {summary: "{}"}
      },
      control: {type: "object"},
      description: `A Tooltip config that is used for rendering the tooltip that appears when hovering over legend shapes.`
    },

    /**
     * category: Formatting
     */
    aggs: {
      type: {summary: "object"},
      table: {
        category: "Formatting",
        defaultValue: {summary: "{}"}
      },
      control: {type: "object"},
      description: `When grouping nested data, D3plus will try it’s best to aggregate all of the data points into a single new data point, but it can only predict so much. By default D3plus sums all number values, but this behavior can be overwritten using the aggs method.

This method accepts an \`object\` where each key matches a key in the current data array. The value of each key is an aggreagation function that method mimics the behavior of many of the d3-array functions: it receives 2 arguments, the Array of objects to condense and an accessor function that retrieves the current key’s value from each data object. This aggregation function is expected to return the final aggregated value for the given key.`
    },
    dataFormat: {
      type: {summary: "function"},
      table: {
        category: "Formatting",
        defaultValue: {
          summary: "function",
          detail: "resp => resp"
        }
      },
      control: {type: null},
      description: `A callback function that allows for manipulation of the loaded data, typically when using a URL with a custom payload structure.`
    },
    label: {
      type: {summary: "string | function"},
      table: {
        category: "Formatting",
        defaultValue: {
          summary: "function",
          detail: `function listify(n) {
  return n.reduce((str, item, i) => {
    if (!i) str += item;
    else if (i === n.length - 1 && i === 1) str += \` and \${item}\`;
    else if (i === n.length - 1) str += \`, and \${item}\`;
    else str += \`, \${item}\`;
    return str;
  }, "");
}

function label(d, i, depth) {
  const l = that._ids(d, i).slice(0, depth + 1);
  const n = l.reverse().find(ll => !(ll instanceof Array)) || l[l.length - 1];
  return n instanceof Array ? listify(n) : \`\${n}\`;
}`}
      },
      control: {type: "text"},
      description: `The text to be used as the label for each Shape.`
    },
     loadingHTML: {
      type: {summary: "boolean"},
      table: {
        category: "Formatting",
        defaultValue: {
          summary: "function",
          detail: `function() {
  return \`
    <div style="left: 50%; top: 50%; position: absolute; transform: translate(-50%, -50%); font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <strong>\${this._translate("Loading Visualization")}</strong>
      <sub style="bottom: 0; display: block; line-height: 1; margin-top: 5px;"><a href="https://d3plus.org" target="_blank">\${this._translate("Powered by D3plus")}</a></sub>
    </div>\`;
}`
        }
      },
      control: {type: "text"},
      description: `Sets the inner HTML of the status message that is displayed when loading AJAX requests and displaying errors. Must be a valid HTML string or a function that returns a valid HTML string.`
    },
     loadingMessage: {
       type: {summary: "boolean"},
       defaultValue: true,
       table: {
         category: "Formatting",
         defaultValue: {summary: "true"}
       },
       control: {type: "boolean"},
       description: `Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.`
     },
     noDataHTML: {
      type: {summary: "boolean"},
      table: {
        category: "Formatting",
        defaultValue: {
          summary: "function",
          detail: `function() {
  return \`
    <div style="left: 50%; top: 50%; position: absolute; transform: translate(-50%, -50%); font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <strong>\${this._translate("No Data Available")}</strong>
    </div>\`;
}`
        }
      },
      control: {type: "text"},
      description: `Sets the inner HTML of the status message that is displayed when no data is supplied to the visualization. Must be a valid HTML string or a function that returns a valid HTML string.`
    },
     noDataMessage: {
       type: {summary: "boolean"},
       defaultValue: true,
       table: {
         category: "Formatting",
         defaultValue: {summary: "true"}
       },
       control: {type: "boolean"},
       description: `Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.`
     },

    /**
     * category: Timeline
     */
    time: {
      type: {summary: "string | function | false"},
      table: {
        category: "Timeline",
        defaultValue: {
          summary: "false"
        }
      },
      control: {type: "text"},
      description: `The accessor key or function to extract a valid JavaScript Date for each data point. Dates will (in most cases) be displayed in a timeline underneath the visualization, and the most recent Date will be selected by default.`
    },
    timeFilter: {
      type: {
        summary: "function"
      },
      table: {
        category: "Timeline",
        defaultValue: {
          summary: "function",
          detail: `import {date} from "d3plus-axis";
import {max} from "d3-array";

function(d, i) {
  const dates = this._data.map(this._time).map(date);
  const latestTime = +max(dates);
  return +date(this._time(d, i)) === latestTime;
}`
        }
      },
      control: {type: null},
      description: `A filter function that determines which Date times should be selected on the timeline. The default behavior will only show the most recent date.

Use this method if you need to modify the default highlighted Date (single or range), as the subsequent value of this function is overwritten whenever the user interacts with the timeline.`
    },
    timeline: {
      type: {summary: "boolean"},
      defaultValue: SampleViz.timeline(),
      table: {
        category: "Timeline",
        defaultValue: {
          summary: SampleViz.timeline()
        }
      },
      control: {type: "boolean"},
      description: `Toggles a timeline below the visualization when the \`time\` method is set.`
    },
    timelineConfig: {
      type: {summary: "object"},
      defaultValue: SampleViz.timelineConfig(),
      table: {
        category: "Timeline",
        defaultValue: {
          summary: typeof SampleViz.timelineConfig(),
          detail: JSON.stringify(SampleViz.timelineConfig(), null, 2)
        }
      },
      control: {type: "object"},
      description: `A Timeline config that is used for rendering the timeline.`
    },
    timelinePadding: {
      type: {summary: "boolean | function"},
      defaultValue: true,
      table: {
        category: "Timeline",
        defaultValue: {
          summary: "function",
          detail: `() => typeof window !== "undefined"
  ? window.innerWidth > 600
  : true`
        }
      },
      control: {type: "boolean"},
      description: `Tells the timeline whether or not to use the internal padding defined by the visualization in it’s positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered above the x-axis.

By default, this padding is only applied on screens larger than 600 pixels wide.`
    },

    /**
     * category: Title
     */
    title: {
      type: {summary: "string | function | false"},
      table: {
        category: "Title",
        defaultValue: {
          summary: "false"
        }
      },
      control: {type: "text"},
      description: `Toggles a text title above the visualization.`
    },
    titleConfig: {
      type: {summary: "object"},
      defaultValue: SampleViz.titleConfig(),
      table: {
        category: "Title",
        defaultValue: {
          summary: typeof SampleViz.titleConfig(),
          detail: JSON.stringify(SampleViz.titleConfig(), null, 2)
        }
      },
      control: {type: "object"},
      description: `A TextBox config that is used for rendering the title.`
    },
    titlePadding: {
      type: {summary: "boolean | function"},
      defaultValue: true,
      table: {
        category: "Title",
        defaultValue: {
          summary: "function",
          detail: `() => typeof window !== "undefined"
  ? window.innerWidth > 600
  : true`
        }
      },
      control: {type: "boolean"},
      description: `Tells the title whether or not to use the internal padding defined by the visualization in it’s positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis.

By default, this padding is only applied on screens larger than 600 pixels wide.`
    },

    /**
     * category: Total
     */
    total: {
      type: {summary: "string | function | false"},
      table: {
        category: "Total",
        defaultValue: {
          summary: "false"
        }
      },
      control: {type: "boolean"},
      description: `Toggles a subtitle that displays a summation of the current data, using either the provided accessor String or Function, or when providing \`true\` it will use the \`size\` method, if defined by the visualization.`
    },
    totalConfig: {
      type: {summary: "object"},
      defaultValue: SampleViz.totalConfig(),
      table: {
        category: "Total",
        defaultValue: {
          summary: typeof SampleViz.totalConfig(),
          detail: JSON.stringify(SampleViz.totalConfig(), null, 2)
        }
      },
      control: {type: "object"},
      description: `A TextBox config that is used for rendering the total.`
    },
    totalFormat: {
      type: {summary: "function"},
      table: {
        category: "Total",
        defaultValue: {
          summary: "function",
          detail: `import {formatAbbreviate} from "d3plus-format";

function(d) {
  const t = this._translate;
  const l = this._locale;
  return \`\${t("Total")}: \${formatAbbreviate(d, l)}\`
}`
        }
      },
      control: {type: null},
      description: `Tells the subtitle whether or not to use the internal padding defined by the visualization in it’s positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis.

By default, this padding is only applied on screens larger than 600 pixels wide.`
    },
    totalPadding: {
      type: {summary: "boolean | function"},
      defaultValue: true,
      table: {
        category: "Total",
        defaultValue: {
          summary: "function",
          detail: `() => typeof window !== "undefined"
  ? window.innerWidth > 600
  : true`
        }
      },
      control: {type: "boolean"},
      description: `Tells the subtitle whether or not to use the internal padding defined by the visualization in it’s positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis.

By default, this padding is only applied on screens larger than 600 pixels wide.`
    },

    /**
     * category: User Interaction
     */
    backConfig: {
      type: {summary: "object"},
      defaultValue: SampleViz.backConfig(),
      table: {
        category: "User Interaction",
        defaultValue: {
          summary: typeof SampleViz.backConfig(),
          detail: JSON.stringify(SampleViz.backConfig(), null, 2)
        }
      },
      control: {type: "object"},
      description: `A TextBox config that is used for rendering the back button that appears when clicking on shapes with nested data.`
    },
     duration: {
      type: {summary: "number"},
      defaultValue: SampleViz.duration(),
      table: {
        category: "User Interaction",
        defaultValue: {summary: SampleViz.duration()}
      },
      control: {type: "number"},
      description: `A number of milliseconds that all animations should take to complete. This includes all entering, transitioning, and exiting animation cycles.`
    },
    tooltip: {
      type: {
        summary: "boolean | function"
      },
      defaultValue: true,
      table: {
        category: "User Interaction",
        defaultValue: {
          summary: true
        }
      },
      control: {type: "boolean"},
      description: `Toggles tooltips that are automatically shown when hovering over shapes.`
    },
    tooltipConfig: {
      type: {summary: "object"},
      defaultValue: SampleViz.tooltipConfig(),
      table: {
        category: "User Interaction",
        defaultValue: {
          summary: typeof SampleViz.tooltipConfig(),
          detail: JSON.stringify(SampleViz.tooltipConfig(), null, 2)
        }
      },
      control: {type: "object"},
      description: `A Tooltip config that is used for rendering the tooltip.`
    },

    /**
     * category: Threshold
     */
    threshold: {
      type: {
        summary: "number | function"
      },
      defaultValue: SampleViz.threshold()(),
      table: {
        category: "Threshold",
        defaultValue: {
          summary: SampleViz.threshold()()
        }
      },
      control: {type: "range", min: 0, max: 1, step: 0.01},
      description: `If used by the visualization, all data that has a share underneath this share (0 to 1) will be displayed grouped together with all other data under the same cutoff.`
    },
    thresholdKey: {
      type: {
        summary: "string | function"
      },
      table: {
        category: "Threshold",
        defaultValue: {
          summary: "undefined"
        }
      },
      control: {type: "text"},
      description: `The accessor key or function to extract a number from each data point to use for the threshold calculation.`
    },
    thresholdName: {
      type: {
        summary: "string | function"
      },
      defaultValue: "Values",
      table: {
        category: "Threshold",
        defaultValue: {
          summary: "function",
          detail: `function() {
  return this._translate("Values");
}`
        }
      },
      control: {type: "text"},
      description: `The text that is used to label items underneath the cutoff. For example, if set to \`"Shapes"\` with a threshold of \`0.001\`, then the resulting shape would be labeled "Shapes < 0.1%".`
    },

    /**
     * category: Zooming
     */
    zoom: {
      type: {summary: typeof SampleViz.zoom()},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: JSON.stringify(SampleViz.zoom(), null, 2)
        }
      },
      control: {type: typeof SampleViz.zoom()},
      description: `Toggles the ability to zoom/pan a visualization (must be supported by Viz).`
    },
    zoomBrushHandleSize: {
      type: {summary: typeof SampleViz.zoomBrushHandleSize()},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: JSON.stringify(SampleViz.zoomBrushHandleSize(), null, 2)
        }
      },
      control: {type: typeof SampleViz.zoomBrushHandleSize()},
      description: `The pixel stroke-width size of the visible handles around the edges of the area that is created while using the zoom brush (the 4th tool in the zooming control panel).`
    },
    zoomBrushHandleStyle: {
      type: {summary: "object | false"},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: typeof SampleViz.zoomBrushHandleStyle(),
          detail: JSON.stringify(SampleViz.zoomBrushHandleStyle(), null, 2)
        }
      },
      control: {type: "object"},
      description: `CSS property/value pairs to be applied to the visible handles around the edges of the area that is created while using the zoom brush (the 4th tool in the zooming control panel).

Passing \`false\` will remove all inline styles.`
    },
    zoomBrushSelectionStyle: {
      type: {summary: "object | false"},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: typeof SampleViz.zoomBrushSelectionStyle(),
          detail: JSON.stringify(SampleViz.zoomBrushSelectionStyle(), null, 2)
        }
      },
      control: {type: "object"},
      description: `CSS property/value pairs to be applied to the visible area that is created while using the zoom brush (the 4th tool in the zooming control panel).

Passing \`false\` will remove all inline styles.`
    },
    zoomControlStyleActive: {
      type: {summary: "object | false"},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: typeof SampleViz.zoomControlStyleActive(),
          detail: JSON.stringify(SampleViz.zoomControlStyleActive(), null, 2)
        }
      },
      control: {type: "object"},
      description: `CSS property/value pairs to be applied to the control buttons that appear in the top-right of a zoomable visualization.

Passing \`false\` will remove all inline styles.`
    },
    zoomControlStyleHover: {
      type: {summary: "object | false"},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: typeof SampleViz.zoomControlStyleHover(),
          detail: JSON.stringify(SampleViz.zoomControlStyleHover(), null, 2)
        }
      },
      control: {type: "object"},
      description: `CSS property/value pairs to be applied to the control buttons that appear in the top-right of a zoomable visualization when the user hovers over them (the \`:hover\` state in CSS).

Passing \`false\` will remove all inline styles.`
    },
    zoomFactor: {
      type: {summary: typeof SampleViz.zoomFactor()},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: SampleViz.zoomFactor()
        }
      },
      control: {type: typeof SampleViz.zoomFactor()},
      description: `The multiplier that is used in with the control buttons when zooming in and out.`
    },
    zoomMax: {
      type: {summary: typeof SampleViz.zoomMax()},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: SampleViz.zoomMax()
        }
      },
      control: {type: typeof SampleViz.zoomMax()},
      description: `The maximum zoom level multiplier that is allowed.`
    },
    zoomPadding: {
      type: {summary: typeof SampleViz.zoomPadding()},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: JSON.stringify(SampleViz.zoomPadding(), null, 2)
        }
      },
      control: {type: typeof SampleViz.zoomPadding()},
      description: `When zooming into a selected area, the pixel value to be used to pad all sides of the zoomed area.`
    },
    zoomPan: {
      type: {summary: typeof SampleViz.zoomPan()},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: JSON.stringify(SampleViz.zoomPan(), null, 2)
        }
      },
      control: {type: typeof SampleViz.zoomPan()},
      description: `Toggles the ability to pan a visualization (must be supported by Viz).`
    },
    zoomScroll: {
      type: {summary: typeof SampleViz.zoomScroll()},
      table: {
        category: "Zooming",
        defaultValue: {
          summary: JSON.stringify(SampleViz.zoomScroll(), null, 2)
        }
      },
      control: {type: typeof SampleViz.zoomScroll()},
      description: `Toggles the ability to zoom a visualization using the mouse/trackpad scrolling (must be supported by Viz).`
    },

    /**
     * category: State
     */
    active: {
      type: {summary: "function"},
      table: {
        category: "State",
        defaultValue: {
          summary: "function",
          detail: "(d, i) => false"
        }
      },
      control: {type: null},
      description: `A filter function that should return \`true\` if the given data point is in an "active" state, and will then have it's activeStyle and activeOpacity applied.`
    },
    filter: {
      type: {summary: "function"},
      table: {
        category: "State",
        defaultValue: {
          summary: "function",
          detail: "(d, i) => true"
        }
      },
      control: {type: null},
      description: `A filter function that should return \`true\` if the given data point should be displayed.`
    },
    hover: {
      type: {summary: "function"},
      table: {
        category: "State",
        defaultValue: {
          summary: "function",
          detail: "(d, i) => false"
        }
      },
      control: {type: null},
      description: `A filter function that should return \`true\` if the given data point is in a "hover" state, and will then have it's hoverStyle and hoverOpacity applied.`
    },

    /**
     * category: DOM Management
     */
    cache: {
      type: {summary: "boolean"},
      defaultValue: SampleViz.cache(),
      table: {
        category: "DOM Management",
        defaultValue: {summary: SampleViz.cache()}
      },
      control: {type: "boolean"},
      description: `Enables a [least recently used (LRU)](https://en.wikipedia.org/wiki/Cache_replacement_policies) caching system that stores up to 5 previously loaded files/URLs.

This is helpful for speed when toggling between a few different data URLs while re-rendering a React component.`
    },
    detectResize: {
      type: {summary: "boolean"},
      defaultValue: SampleViz.detectResize(),
      table: {
        category: "DOM Management",
        defaultValue: {summary: SampleViz.detectResize()}
      },
      control: {type: "boolean"},
      description: `If the width and/or height of a Viz is not staticly defined, it is determined by the size of it's parent element. When this method is set to \`true\`, the Viz will listen for the \`window.onresize\` event and adjust it's dimensions accordingly.`
    },
    detectResizeDelay: {
      type: {summary: "number"},
      defaultValue: SampleViz.detectResizeDelay(),
      table: {
        category: "DOM Management",
        defaultValue: {summary: SampleViz.detectResizeDelay()}
      },
      control: {type: "number"},
      description: `When resizing the browser window, this is the millisecond delay to trigger the resize event.`
    },
    detectVisible: {
      type: {summary: "boolean"},
      defaultValue: SampleViz.detectVisible(),
      table: {
        category: "DOM Management",
        defaultValue: {summary: SampleViz.detectVisible()}
      },
      control: {type: "boolean"},
      description: `Toggles whether or not the visualization should try to detect if it visible in the current viewport.

When this method is set to \`true\`, the visualization will only be rendered when it has entered the viewport either through scrolling or if it's display or visibility property has changed.`
    },
    detectVisibleInterval: {
      type: {summary: "number"},
      defaultValue: SampleViz.detectVisibleInterval(),
      table: {
        category: "DOM Management",
        defaultValue: {summary: SampleViz.detectVisibleInterval()}
      },
      control: {type: "number"},
      description: `The interval, in milliseconds, for checking if the visualization is visible on the page.`
    },
    scrollContainer: {
      type: {summary: "string | HTMLElement"},
      table: {
        category: "DOM Management",
        defaultValue: {
          summary: "window",
          detail: `typeof window === undefined ? "" : window`
        }
      },
      control: {type: null},
      description: `When using \`detectVisible\`, this is the element whose scroll event is listened to in order to determine visibility. If your visualization is nested inside another page element with it's own scroll overflow, sets the method to the a d3 selector \`string\` for that element or the DOM element itself.`
    },
    select: {
      type: {summary: "string | HTMLElement"},
      table: {
        category: "DOM Management",
        defaultValue: {
          summary: "document.body"
        }
      },
      control: {type: null},
      description: `Sets the parentNode of the SVG container element to the provided d3 selector \`string\` or DOM element.

In React, this is inferred by the placement of the Component. In vanilla environments, if not specified, the SVG will be appended directly to the body of the document.`
    },

    /**
     * category: Accessibility
     */
    ariaHidden: {
      type: {
        summary: "boolean"
      },
      defaultValue: SampleViz.ariaHidden(),
      table: {
        category: "Accessibility",
        defaultValue: {
          summary: SampleViz.ariaHidden()
        }
      },
      control: {type: "boolean"},
      description: `Sets the "aria-hidden" attribute of the containing SVG element.

Setting this to \`false\` allows the SVG to be analyzed by screen readers.`
    },
    attribution: {
      type: {summary: "string | false"},
      table: {
        category: "Accessibility",
        defaultValue: {
          summary: SampleViz.attribution()
        }
      },
      control: {type: "text"},
      description: `Sets text to be shown positioned in the bottom-right corner of a visualization.

This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).`
    },
    attributionStyle: {
      type: {summary: "object | false"},
      defaultValue: SampleViz.attributionStyle(),
      table: {
        category: "Accessibility",
        defaultValue: {
          summary: typeof SampleViz.attributionStyle(),
          detail: JSON.stringify(SampleViz.attributionStyle(), null, 2)
        }
      },
      control: {type: "object"},
      description: `CSS property/value pairs to be applied to the attribution that can appear in the bottom-right of a visualization.

Passing \`false\` will remove all inline styles.`
    },
    svgDesc: {
      type: {
        summary: "string"
      },
      table: {
        category: "Accessibility",
        defaultValue: {
          summary: SampleViz.svgDesc()
        }
      },
      control: {type: "text"},
      description: `If a description of the visualization is provided to this method, a \`<desc>\` tag will be added to the SVG, and referenced in the SVG's \`aria-labelledby\` attribute.`
    },
    svgTitle: {
      type: {
        summary: "string"
      },
      table: {
        category: "Accessibility",
        defaultValue: {
          summary: SampleViz.svgTitle()
        }
      },
      control: {type: "text"},
      description: `If a title for the visualization is provided to this method, a \`<title>\` tag will be added to the SVG, and referenced in the SVG's \`aria-labelledby\` attribute.

Warning: Using this method causes some browsers (including Chrome) to display this contents of this title in a small pop-up whenever the mouse cursor is paused anywhere on top of the visualization, in addition to any d3plus tooltips that are already appearing.`
    },

  },
  ...BaseClass.argTypes
}
