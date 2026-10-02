// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../../args/core/utils/configWarnings.args";
import {configWarnings} from "@d3plus/core";

export default {
  title: "Core/Utils/configWarnings",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Toggles the console warnings d3plus logs when a class receives a config\nproperty it does not support (like a misspelled key passed to .config()\nor shapeConfig). Warnings are on by default and the setting applies to\nevery chart on the page. With no argument, returns the current setting.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {useEffect, useState} from "react";
import {Legend} from "@d3plus/core";

const buttonStyle = {padding: "6px 12px", fontSize: 13, borderRadius: 4, border: "1px solid #ced4da", background: "#fff", cursor: "pointer"};

// Mirrors console.warn into the story while mounted, so the warnings d3plus
// logs for unknown config keys are visible on the page.
const Demo = () => {
  const [enabled, setEnabled] = useState(configWarnings());
  const [log, setLog] = useState([]);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const original = console.warn;
    console.warn = (...args) => {
      setLog(list => [...list, args.join(" ")]);
      original(...args);
    };
    return () => {
      console.warn = original;
      configWarnings(true);
    };
  }, []);
  const toggle = value => {
    configWarnings(value);
    setEnabled(configWarnings());
  };
  const misspell = () => {
    // Each message is only ever logged once, so vary the key to see repeats.
    new Legend().config({[`titel${count + 1}`]: "Sales"});
    setCount(n => n + 1);
  };
  return (
    <div style={{display: "grid", gap: 10, fontSize: 13}}>
      <div style={{display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"}}>
        <button type="button" style={buttonStyle} onClick={misspell}>
          new Legend().config({"{"}titel{count + 1}: "Sales"{"}"})
        </button>
        <label style={{display: "flex", gap: 6, alignItems: "center"}}>
          <input type="checkbox" checked={enabled} onChange={e => toggle(e.target.checked)} />
          <code>configWarnings({String(enabled)})</code>
        </label>
      </div>
      <pre style={{margin: 0, minHeight: 40, padding: 8, background: "#f8f9fa", borderRadius: 4, fontSize: 12}}>
        {log.length ? log.join("\n") : "console.warn output appears here"}
      </pre>
    </div>
  );
};

export const BasicExample = () => <Demo />;
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {configWarnings, Legend} from "@d3plus/core";

new Legend().config({titel: "Sales"});
// console: Legend received unknown property "titel".

configWarnings(false);   // silence the check for every chart on the page
configWarnings();        // false`,
      language: "jsx",
    },
    description: {
      story: "Every class checks the keys handed to `config()` and warns once about any it does not support, which catches misspellings such as `titel`. Press the button to trigger a warning, then untick the box to turn the check off page-wide; with no argument the function reports the current setting.",
    },
  },
};
