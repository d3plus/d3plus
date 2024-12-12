import React from "react";
import { argTypes as networkArgTypes } from "./Network.args";
import { assign } from "d3plus-common";

import { Sankey as D3plusSankey} from "d3plus-react";
export const Sankey = ({ config }) => <D3plusSankey config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Network args and
   * overrides any defaults that have been changed in Sankey
   */
  Object.keys(networkArgTypes)
    .filter(k => !k.match(/^(linkSize|linkSizeMin|linkSizeScale|nodeGroupBy|size|sizeMax|sizeMin|sizeScale|x|y|shape|zoom*)$/))
    .reduce((obj, k) => (obj[k] = networkArgTypes[k], obj), {}),

  /**
   * Sankey-specific methods
   */
  {
    linksSource: {
      type: {
        summary: "string"
      },
      defaultValue: "source",
      table: {
        defaultValue: {
          summary: "string"
        }
      },
      control: {
        type: "text"
      },
      description: "Sets the key inside of each link object that references the source node."
    },
    linksTarget: {
      type: {
        summary: "string"
      },
      defaultValue: "target",
      table: {
        defaultValue: {
          summary: "string"
        }
      },
      control: {
        type: "text"
      },
      description: "Sets the key inside of each link object that references the target node."
    },
    nodeAlign: {
      type: {
        summary: "function | string"
      },
      defaultValue: "justify",
      table: {
        defaultValue: {
          summary: "justify"
        }
      },
      control: {
        type: "select",
        options: ["left", "right", "center", "justify"]
      },
      description: "Sets the nodeAlign property of the sankey layout."
    },
    nodeId: {
      type: {
        summary: "string"
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
      description: "Sets the node id accessor(s) to the specified array of values"
    },
    nodePadding: {
      type: {
        summary: "number"
      },
      defaultValue: 8,
      table: {
        defaultValue: {
          summary: 8
        }
      },
      control: {
        type: "number"
      },
      description: "Sets the padding of the node."
    },
    nodeWidth: {
      type: {
        summary: "number"
      },
      defaultValue: 30,
      table: {
        defaultValue: {
          summary: 30
        }
      },
      control: {
        type: "number"
      },
      description: "Sets the width of the node."
    },
    value: {
      type: {
        summary: "function | number"
      },
      defaultValue: d => d.value,
      table: {
        defaultValue: {
          summary: "function",
          detail: "d => d.value"
        }
      },
      control: {
        type: null
      },
      description: "Sets the width of the links."
    }
  }
);
