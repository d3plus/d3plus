// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/onFontsLoaded.args";
import {onFontsLoaded} from "@d3plus/dom";

export default {
  title: "Dom/onFontsLoaded",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Registers a callback to run whenever the browser finishes loading a web font that d3plus has already measured text with — the moment any text laid out with that font's fallback becomes stale. Returns a function that removes the callback.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {useEffect, useState} from "react";
import {textWidth} from "@d3plus/dom";

const sample = "Sphinx of black quartz, judge my vow";
const style = {"font-family": "Lobster", "font-size": 20};
const stylesheet = "https://fonts.googleapis.com/css2?family=Lobster&display=swap";

// Measures a string in a web font the page has not loaded, subscribes to
// font loads, then lets the viewer load the font and watch the width jump
// once the real glyphs replace the fallback's.
const Demo = () => {
  const [events, setEvents] = useState([]);
  const [requested, setRequested] = useState(false);
  const width = textWidth(sample, style);
  useEffect(
    () =>
      onFontsLoaded(() =>
        setEvents(list => [...list, `font load at ${new Date().toLocaleTimeString()}`]),
      ),
    [],
  );
  const loadFont = () => {
    setRequested(true);
    if (!document.querySelector(`link[href="${stylesheet}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = stylesheet;
      document.head.appendChild(link);
    }
    document.fonts.load(`20px Lobster`).catch(() => undefined);
  };
  return (
    <div style={{display: "grid", gap: 10, fontSize: 13}}>
      <span style={{fontFamily: "Lobster, cursive", fontSize: 20, whiteSpace: "pre"}}>{sample}</span>
      <div style={{width, height: 3, background: "#1c7ed6"}} />
      <code>
        textWidth(…, {JSON.stringify(style)}) → {Math.round(width * 100) / 100}px
      </code>
      <div>
        <button type="button" onClick={loadFont} disabled={requested}>
          {requested ? "Lobster requested from Google Fonts" : "Load the Lobster web font"}
        </button>
      </div>
      <code style={{color: "#666"}}>
        onFontsLoaded callbacks: {events.length}
        {events.map(e => `\n  ${e}`).join("")}
      </code>
    </div>
  );
};

export const BasicExample = () => <Demo />;
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {onFontsLoaded, textWidth} from "@d3plus/dom";

// Measured before the font arrives: the fallback font's width.
let width = textWidth("Sphinx of black quartz, judge my vow", {"font-family": "Lobster", "font-size": 20});

const stop = onFontsLoaded(() => {
  // Lobster has loaded, and the earlier measurement is stale.
  width = textWidth("Sphinx of black quartz, judge my vow", {"font-family": "Lobster", "font-size": 20});
});

// Later, to stop listening:
stop();`,
      language: "jsx",
    },
    description: {
      story: "Text measured before a web font finishes downloading uses the fallback font's metrics. `onFontsLoaded` runs its callback whenever the browser finishes loading a font that d3plus has already measured with, and returns a function that unsubscribes. Charts use it to redraw labels once their fonts arrive. Press the button to fetch a font from Google Fonts and watch the measured width change (this needs network access).",
    },
  },
};
