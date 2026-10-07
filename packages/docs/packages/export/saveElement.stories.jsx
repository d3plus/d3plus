// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/export/saveElement.args";
import {saveElement} from "@d3plus/export";

export default {
  title: "Export/saveElement",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Downloads an HTML Element as a bitmap PNG image.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {useRef, useState} from "react";

const badge = (
  <svg width="180" height="100" viewBox="0 0 180 100" style={{display: "block"}}>
    <rect width="180" height="100" rx="12" fill="#1c7ed6" />
    <circle cx="50" cy="50" r="26" fill="#74c0fc" />
    <text x="92" y="44" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="700" fill="#fff">d3plus</text>
    <text x="92" y="66" fontFamily="Inter, sans-serif" fontSize="12" fill="#d0ebff">saveElement demo</text>
  </svg>
);

const buttonStyle = {padding: "6px 12px", fontSize: 13, borderRadius: 4, border: "1px solid #ced4da", background: "#fff", cursor: "pointer"};

// Saves either the container div or the <svg> inside it; the callback
// reports when the browser has been handed the file.
const Demo = ({types, svgOnly}) => {
  const ref = useRef(null);
  const [status, setStatus] = useState("");
  const save = type => {
    const target = svgOnly ? ref.current.querySelector("svg") : ref.current;
    setStatus(`rendering ${type}…`);
    saveElement(target, {type, filename: "d3plus-demo", callback: () => setStatus(`saved d3plus-demo.${type}`)});
  };
  return (
    <div style={{display: "grid", gap: 12, justifyItems: "start"}}>
      <div ref={ref} style={{padding: 16, background: "#fff"}}>
        {badge}
      </div>
      <div style={{display: "flex", gap: 8, alignItems: "center"}}>
        {types.map(type => (
          <button key={type} type="button" style={buttonStyle} onClick={() => save(type)}>
            Save as {type.toUpperCase()}
          </button>
        ))}
        <code style={{fontSize: 12, color: "#666"}}>{status}</code>
      </div>
    </div>
  );
};

export const BasicExample = () => <Demo types={["png", "jpg", "svg"]} />;
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {saveElement} from "@d3plus/export";

const container = document.querySelector("#badge");

saveElement(container, {type: "png", filename: "d3plus-demo", callback: () => console.log("saved")});
saveElement(container, {type: "jpg", filename: "d3plus-demo"}, {backgroundColor: "#ffffff"});
saveElement(container, {type: "svg", filename: "d3plus-demo"});`,
      language: "jsx",
    },
    description: {
      story: "Captures a DOM element and downloads it as `png` (default), `jpg`, or `svg`, named by `filename` plus the matching extension. Here the target is the white container, so the padding around the badge is part of the image. `callback` runs once the file has been handed to the browser; the status line shows it firing.",
    },
  },
};

export const SvgElementTarget = () => <Demo types={["svg"]} svgOnly />;
SvgElementTarget.parameters = {
  docs: {
    source: {
      code: `import {saveElement} from "@d3plus/export";

// The element is itself an <svg>, so it is serialized as-is.
saveElement(document.querySelector("#badge svg"), {type: "svg", filename: "d3plus-demo"});`,
      language: "jsx",
    },
    description: {
      story: "When the element passed is an `<svg>` and the type is `svg`, the markup is serialized directly instead of being wrapped in an HTML `<foreignObject>`, which is what vector editors such as Figma and Illustrator need to open the file. A chart's own `<svg>` is `viz.select().node()` once it has rendered.",
    },
  },
};
