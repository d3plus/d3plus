const config = {
  nodes: [
    {id: "alpha", group: "north"},
    {id: "beta", group: "north"},
    {id: "gamma", group: "south"},
    {id: "epsilon", group: "south"},
    {id: "zeta", group: "east"},
    {id: "theta", group: "east"},
  ],
  links: [
    {source: "alpha", target: "beta", weight: 10, kind: "road"},
    {source: "alpha", target: "gamma", weight: 10, kind: "rail"},
    {source: "epsilon", target: "zeta", weight: 10, kind: "road"},
    {source: "epsilon", target: "theta", weight: 5, kind: "ferry"},
    {source: "theta", target: "alpha", weight: 20, kind: "rail"},
    {source: "gamma", target: "beta", weight: 12, kind: "road"},
    {source: "zeta", target: "theta", weight: 12, kind: "rail"},
  ],
  color: "group",
  linkSize: d => d.weight,
  nodeTooltipLinks: 2,
  shapeConfig: {
    Path: {
      stroke: d => (d.source.group === d.target.group ? "#495057" : "#adb5bd"),
    },
  },
};
