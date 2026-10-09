// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/ckmeans.args";
import {ckmeans} from "@d3plus/math";

export default {
  title: "Math/ckmeans",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Clusters one-dimensional numeric data into a specified number of groups using the Ckmeans dynamic programming algorithm, minimizing within-group sum-of-squared-deviations.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const palette = ["#4c6ef5", "#e67700", "#e03131", "#2f9e44", "#ae3ec9"];

// A one-dimensional strip: each value is a dot colored by the cluster it
// landed in.
const Strip = ({data, k}) => {
  const clusters = ckmeans(data, k);
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const pad = (hi - lo) * 0.08;
  return (
    <GeometryExample
      height={90}
      domain={{x: [lo - pad, hi + pad], y: [0, 1]}}
      shapes={[
        {type: "segment", from: [lo - pad, 0.5], to: [hi + pad, 0.5], stroke: "#dee2e6"},
        ...clusters.flatMap((cluster, c) => cluster.map(v => ({type: "point", at: [v, 0.5], r: 6, fill: palette[c % palette.length]}))),
        ...clusters.map((cluster, c) => ({type: "point", at: [cluster[0], 0.5], r: 0, label: `cluster ${c + 1}`})),
      ]}
      output={`ckmeans(${JSON.stringify(data)}, ${k})\n// → ${JSON.stringify(clusters)}`}
    />
  );
};

const params = (sets, story) => ({
  docs: {
    ...sourceSnippet(
      "math",
      "ckmeans",
      sets.map(([data, k]) => ({call: `ckmeans(${JSON.stringify(data)}, ${k})`, result: JSON.stringify(ckmeans(data, k))})),
    ).docs,
    description: {story},
  },
});

const grouped = [1, 2, 3, 10, 11, 12, 20, 21, 22];
export const BasicExample = () => <Strip data={grouped} k={3} />;
BasicExample.parameters = params(
  [[grouped, 3]],
  "Splits a list of numbers into `k` groups so that values within a group are as close together as possible (the Ckmeans algorithm, an exact 1-D k-means). Three obvious clumps come back as three clusters. This is the \"jenks\" option of a chart's `colorScale`.",
);

export const ClusterCount = () => (
  <div style={{display: "grid", gap: 12}}>
    <Strip data={grouped} k={2} />
    <Strip data={grouped} k={4} />
  </div>
);
ClusterCount.parameters = params(
  [[grouped, 2], [grouped, 4]],
  "The number of clusters is yours to choose; the algorithm finds the best split for that count. Asking for two merges the nearest clumps, asking for four splits one of them. `k` cannot exceed the number of values.",
);

const skewed = [1, 2, 3, 4, 5, 100];
export const Outliers = () => <Strip data={skewed} k={2} />;
Outliers.parameters = params(
  [[skewed, 2]],
  "Because the criterion is within-cluster variance, a lone extreme value gets a cluster of its own rather than dragging a boundary toward it, which keeps color-scale breaks sensible on skewed data.",
);
