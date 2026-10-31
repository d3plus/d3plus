const config = {
  data: [{name: "Alpha", x: 42, y: 17, share: 0.31}],
  title: d => d.name,
  thead: ["Metric", "Value"],
  tbody: [
    ["x", d => d.x],
    ["y", d => d.y],
    ["share", d => `${Math.round(d.share * 100)}%`],
  ],
};
