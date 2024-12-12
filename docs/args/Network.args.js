import React from "react";
import Viz from "./Viz.args";
import { assign } from "d3plus-common";

import { Network as D3plusNetwork } from "d3plus-react";
export const Network = ({ config }) => <D3plusNetwork config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Network
   */
  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Network-specific methods
   */
  {
    hover: {
      type: {
        summary: "function"
      },
      defaultValue: undefined,
      table: {
        defaultValue: {
          summary: "function"
        }
      },
      control: {
        type: null
      },
      description: "Sets the hover method to the specified function."
    },
    links: {
      type: {
        summary: "array | string | function"
      },
      defaultValue: [],
      table: {
        defaultValue: {
          summary: "[]"
        }
      },
      control: {
        type: "array"
      },
      description: `A predefined array of edges that connect each object passed to the node method. The \`source\` and \`target\` keys in each link need to map the nodes in one of three ways:
1. The index of the node in the nodes array.
2. The actual node object itself.
3. A string value matching the \`id\` of the node.
      `
    },
    linkSize: {
      type: {
        summary: "number | function"
      },
      defaultValue: 1,
      table: {
        defaultValue: {
          summary: 1
        }
      },
      control: {
        type: "number"
      },
      description: "Defines the pixel thickness of the links connecting each node."
    },
    linkSizeMin: {
      type: {
        summary: "number"
      },
      defaultValue: 1,
      table: {
        defaultValue: {
          summary: 1
        }
      },
      control: {
        type: "number"
      },
      description: "Defines the minimum pixel stroke width used in link sizing."
    },
    linkSizeScale: {
      type: {
        summary: "string"
      },
      defaultValue: "sqrt",
      table: {
        defaultValue: {
          summary: "sqrt"
        }
      },
      control: {
        type: "select",
        options: ["identity", "linear", "log", "pow", "radial", "sqrt"]
      },
      description: "Sets the specific type of continuous d3-scale used when calculating the pixel size of links in the network."
    },
    nodeGroupBy: {
      type: {
        summary: "string | function | array"
      },
      defaultValue: "id",
      table: {
        defaultValue: {
          summary: "id"
        }
      },
      control: {
        type: "text"
      },
      description: "Sets the node group accessor(s) to the specified string, function, or array of values."
    },
    nodes: {
      type: {
        summary: "array | string | function"
      },
      defaultValue: [],
      table: {
        defaultValue: {
          summary: []
        }
      },
      control: {
        type: "array"
      },
      description: `The list of nodes to be used for drawing the network. The value passed should either be an arary of data or a string representing a filepath or URL to be loaded.
      Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node array.`
    },
    size: {
      type: {
        summary: "function | string"
      },
      defaultValue: d => d.size,
      table: {
        defaultValue: {
          summary: "function",
          detail: "d => d.size"
        }
      },
      control: {
        type: null
      },
      description: "Sets the size accessor to the specified function or data key."
    },
    sizeMax: {
      type: {
        summary: "number"
      },
      defaultValue: undefined,
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      control: {
        type: "number"
      },
      description: "Defines the maximum pixel radius used in size scaling. By default, the maximum size is determined by half the distance of the two closest nodes."
    },
    sizeMin: {
      type: {
        summary: "number"
      },
      defaultValue: 5,
      table: {
        defaultValue: {
          summary: 5
        }
      },
      control: {
        type: "number"
      },
      description: "Defines the minimum pixel radius used in size scaling."
    },
    sizeScale: {
      type: {
        summary: "string"
      },
      defaultValue: "sqrt",
      table: {
        defaultValue: {
          summary: "sqrt"
        }
      },
      control: {
        type: "select",
        options: ["identity", "linear", "log", "pow", "radial", "sqrt"]
      },
      description: "Sets the specific type of continuous d3-scale used when calculating the pixel size of nodes in the network."
    },
    x: {
      type: {
        summary: "function | string"
      },
      defaultValue: d => d.x,
      table: {
        defaultValue: {
          summary: "function",
          detail: "d => d.x"
        }
      },
      control: {
        type: null
      },
      description: `Sets the x accessor to the specified function or string matching a key in the data.
If it is defined, it will takes priority over the nodes data array.
By default, the x and y positions are determined dynamically based on default force layout properties.`
    },
    y: {
      type: {
        summary: "function | string"
      },
      defaultValue: d => d.y,
      table: {
        defaultValue: {
          summary: "function",
          detail: "d => d.y"
        }
      },
      control: {
        type: null
      },
      description: `Sets the y accessor to the specified function or string matching a key in the data.
If it is defined, it will takes priority over the nodes data array.
By default, the x and y positions are determined dynamically based on default force layout properties.`
    }
  }
);
