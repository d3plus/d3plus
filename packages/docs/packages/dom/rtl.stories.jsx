// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/rtl.args";
import {rtl} from "@d3plus/dom";

export default {
  title: "Dom/rtl",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Returns true if the HTML or body element has either the \"dir\" HTML attribute or the \"direction\" CSS property set to \"rtl\".",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {useEffect, useState} from "react";

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

// Reads rtl() live and lets the viewer flip the page's direction to see it
// change; the attribute is removed again when the story unmounts.
const Live = () => {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    document.body.dir = flipped ? "rtl" : "";
    return () => {
      document.body.dir = "";
    };
  }, [flipped]);
  return (
    <div style={{display: "grid", gap: 12}}>
      <label style={{fontSize: 13, display: "flex", gap: 8, alignItems: "center"}}>
        <input type="checkbox" checked={flipped} onChange={e => setFlipped(e.target.checked)} />
        set <code>dir="rtl"</code> on this page's <code>&lt;body&gt;</code>
      </label>
      <CallGrid calls={[{call: "rtl()", result: JSON.stringify(rtl())}]} />
    </div>
  );
};

export const BasicExample = () => <Live />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("dom", "rtl", [{call: "rtl()", result: "false"}, {call: 'document.body.dir = "rtl";\nrtl()', result: "true"}]).docs,
    description: {
      story: "True when the document is right-to-left, judged by the `dir` attribute or the computed `direction` of `<html>` or `<body>`. Charts read it to mirror legends, timelines, and text alignment. Tick the box to flip this page and watch the value change.",
    },
  },
};
