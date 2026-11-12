const config = {
  data: [
    {region: "West", state: "Oregon", value: 30},
    {region: "West", state: "Nevada", value: 25},
    {region: "West", state: "Utah", value: 18},
    {region: "South", state: "Texas", value: 40},
    {region: "South", state: "Georgia", value: 22},
    {region: "East", state: "Ohio", value: 28},
    {region: "East", state: "Maine", value: 14},
  ],
  depth: 0,
  groupBy: ["region", "state"],
  sum: "value",
  tooltip: (d, i, {depth, maxDepth}) => depth === maxDepth,
};
