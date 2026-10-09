// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/negativeSpace.args";
import {negativeSpace} from "@d3plus/math";

export default {
  title: "Math/negativeSpace",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Finds the open, axis-aligned rectangles inside bounds that lie entirely\noutside the marks described by obstacles. The marks are treated as a single\nsolid region — the convex hull of every (padded) obstacle box — so a hole in\nthe middle of a ring of points is never returned, only the space around them.\nBoxes in options.exclude are kept clear too, each on its own. Each\nreturned box is maximal (it cannot grow in any direction without leaving\nbounds or touching the hull or an excluded box). Results are sorted largest area first, and the\noutput is deterministic for a given input.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 100) / 100;
const bounds = {x: 0, y: 0, width: 260, height: 200};
const marks = [
  {x: 60, y: 50, width: 40, height: 40},
  {x: 120, y: 90, width: 50, height: 30},
  {x: 90, y: 140, width: 30, height: 30},
];
const summary = boxes => boxes.map(b => ({x: r(b.x), y: r(b.y), width: r(b.width), height: r(b.height)}));
const rect = (b, extra) => ({type: "rect", x: b.x, y: b.y, width: b.width, height: b.height, ...extra});

const Diagram = ({options, optionsSource, shown = 3}) => {
  const boxes = negativeSpace(bounds, marks, options);
  const call = `negativeSpace(bounds, marks${optionsSource ? `, ${optionsSource}` : ""})`;
  return (
    <GeometryExample
      shapes={[
        rect(bounds, {stroke: "#dee2e6"}),
        ...(options?.exclude || []).map(b => rect(b, {stroke: "#868e96", fill: "rgba(134, 142, 150, 0.15)", dashed: true})),
        ...marks.map(b => rect(b, {stroke: "#1c7ed6", fill: "rgba(28, 126, 214, 0.25)"})),
        ...boxes.slice(0, shown).map((b, i) => rect(b, {dashed: true, fill: `rgba(240, 140, 0, ${0.18 - i * 0.05})`})),
        ...boxes.slice(0, shown).map((b, i) => ({type: "point", at: [b.x, b.y + b.height], r: 0, label: `${i + 1}`})),
      ]}
      output={`${call}\n// → ${boxes.length} boxes, largest first\n${JSON.stringify(summary(boxes.slice(0, shown)), null, 2).split("\n").map(l => `// ${l}`).join("\n")}`}
    />
  );
};

const params = (options, optionsSource, story) => ({
  docs: {
    ...sourceSnippet("math", "negativeSpace", [
      {
        call: `const bounds = ${JSON.stringify(bounds)};\nconst marks = ${JSON.stringify(marks)};\nnegativeSpace(bounds, marks${optionsSource ? `, ${optionsSource}` : ""}).slice(0, 3)`,
        result: JSON.stringify(summary(negativeSpace(bounds, marks, options).slice(0, 3)), null, 2),
      },
    ]).docs,
    description: {story},
  },
});

export const BasicExample = () => <Diagram />;
BasicExample.parameters = params(
  undefined,
  "",
  "Finds the empty rectangles inside `bounds` that avoid the marks (blue). The marks are treated as one solid region, their convex hull, so only the space around them is returned, never a pocket between them. Every box is maximal and the list is sorted largest first; the three largest are shown in orange. Charts use this to tuck a legend into unused plot area.",
);

export const Padding = () => <Diagram options={{padding: 12}} optionsSource="{padding: 12}" />;
Padding.parameters = params(
  {padding: 12},
  "{padding: 12}",
  "`padding` keeps that many pixels clear around every mark, so the free boxes stop short of the hull. `minWidth` and `minHeight` drop boxes too small to be useful.",
);

export const Exclude = () => (
  <Diagram options={{exclude: [{x: 190, y: 0, width: 70, height: 40}]}} optionsSource="{exclude: [{x: 190, y: 0, width: 70, height: 40}]}" />
);
Exclude.parameters = params(
  {exclude: [{x: 190, y: 0, width: 70, height: 40}]},
  "{exclude: [{x: 190, y: 0, width: 70, height: 40}]}",
  "`exclude` lists extra boxes to keep clear of on their own, outside the hull, such as controls overlaid in a corner (grey). The free boxes now avoid that corner as well.",
);
