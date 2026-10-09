// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../../args/core/utils/accessor.args";
import {accessor} from "@d3plus/core";

export default {
  title: "Core/Utils/accessor",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Wraps an object key in a simple accessor function.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../../helpers/CallGrid.jsx";
import sourceSnippet from "../../../helpers/sourceSnippet.js";

const row = {id: "alpha", value: 3};
const rows = [{id: "alpha"}, {id: "beta"}, {id: "gamma"}];

const basicCalls = [
  {call: 'accessor("id")({id: "alpha", value: 3})', result: JSON.stringify(accessor("id")(row))},
  {call: 'accessor("value")({id: "alpha", value: 3})', result: JSON.stringify(accessor("value")(row))},
  {call: '[{id: "alpha"}, {id: "beta"}, {id: "gamma"}].map(accessor("id"))', result: JSON.stringify(rows.map(accessor("id")))},
];
export const BasicExample = () => <CallGrid calls={basicCalls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("core", "accessor", basicCalls).docs,
    description: {
      story: "Turns a key into the function `d => d[key]`. Every chart config that accepts \"a key or an accessor\" (`groupBy`, `x`, `y`, `sum`, `label`, …) runs string values through this, so the rest of the pipeline only ever deals with functions.",
    },
  },
};

const defaultCalls = [
  {call: 'accessor("missing")({id: "alpha"})', result: String(accessor("missing")({id: "alpha"}))},
  {call: 'accessor("missing", "n/a")({id: "alpha"})', result: JSON.stringify(accessor("missing", "n/a")({id: "alpha"}))},
  {call: 'accessor("value", 0)({id: "alpha", value: 3})', result: JSON.stringify(accessor("value", 0)(row))},
];
export const DefaultValue = () => <CallGrid calls={defaultCalls} />;
DefaultValue.parameters = {
  docs: {
    ...sourceSnippet("core", "accessor", defaultCalls).docs,
    description: {
      story: "A second argument is returned whenever the key is `undefined` on a row, which is how optional config such as `x` or `y` fall back to `0` for rows missing the field.",
    },
  },
};
