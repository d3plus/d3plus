const steps = [
  {id: "Plan"},
  {id: "Design"},
  {id: "Build"},
  {id: "Test"},
  {id: "Release"},
];

const config = {
  nodes: steps,
  links: [
    {source: "Plan", target: "Design", days: 3},
    {source: "Design", target: "Build", days: 8},
    {source: "Build", target: "Test", days: 5},
    {source: "Test", target: "Release", days: 2},
    {source: "Test", target: "Build", days: 4, rework: true},
    {source: "Release", target: "Plan", days: 1, rework: true},
  ],
  arcSide: "both",
  arrows: true,
  linkColor: d => (d.rework ? "#d9480f" : null),
  linkLabel: d => `${d.days} days`,
};
