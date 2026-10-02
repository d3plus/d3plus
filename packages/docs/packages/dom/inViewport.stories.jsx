// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/inViewport.args";
import {inViewport} from "@d3plus/dom";

export default {
  title: "Dom/inViewport",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Determines whether a given DOM element is visible within the current viewport, with an optional pixel buffer.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {useEffect, useRef, useState} from "react";

// Re-checks the badge on every scroll and resize so the value tracks the
// viewport as the page moves.
const Live = ({buffer = 0}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(null);
  useEffect(() => {
    const check = () => setVisible(inViewport(ref.current, buffer));
    check();
    window.addEventListener("scroll", check, true);
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check, true);
      window.removeEventListener("resize", check);
    };
  }, [buffer]);
  return (
    <div
      ref={ref}
      style={{
        display: "inline-block",
        padding: "10px 16px",
        borderRadius: 6,
        fontFamily: "ui-monospace, monospace",
        fontSize: 13,
        background: visible ? "#d3f9d8" : "#ffe3e3",
        color: visible ? "#2b8a3e" : "#c92a2a",
      }}
    >
      inViewport(badge{buffer ? `, ${buffer}` : ""}) → {JSON.stringify(visible)}
    </div>
  );
};

export const BasicExample = () => <Live />;
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {inViewport} from "@d3plus/dom";

inViewport(document.querySelector(".badge")); // true while any part of it is on screen`,
      language: "jsx",
    },
    description: {
      story: "True while any part of the element's bounding box overlaps the browser viewport. Scroll this story partly out of view to see it flip. Charts with `detectVisible` use this to delay their first draw until they are on screen.",
    },
  },
};

export const WithBuffer = () => <Live buffer={100} />;
WithBuffer.parameters = {
  docs: {
    source: {
      code: `import {inViewport} from "@d3plus/dom";

// Only true once the element is at least 100px inside every viewport edge.
inViewport(document.querySelector(".badge"), 100);`,
      language: "jsx",
    },
    description: {
      story: "The second argument shrinks the viewport by that many pixels on every side, so the element has to be well inside the window, not just touching its edge, before this reports `true`.",
    },
  },
};
