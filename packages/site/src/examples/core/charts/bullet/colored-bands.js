const config = {
  data: [
    {id: "CPU", value: 64, target: 75},
    {id: "Memory", value: 81, target: 75},
    {id: "Disk", value: 37, target: 75},
  ],
  bands: [
    {max: 60, color: "#2b8a3e"},
    {max: 85, color: "#e67700"},
    {color: "#c92a2a"},
  ],
  domain: [0, 100],
  shapeConfig: {fill: "#f1f3f5"},
  targetConfig: {stroke: "#1f2328"},
};
