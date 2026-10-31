const config = {
  nodes: [
    {id: "alpha", x: 1, y: 1.5},
    {id: "beta", x: 2, y: 1},
    {id: "gamma", x: 2, y: 2},
    {id: "delta", x: 3, y: 1.5},
  ],
  links: [
    {source: 0, target: 1},
    {source: 0, target: 2},
    {source: 1, target: 3},
    {source: 2, target: 3},
  ],
  arrows: "target",
};
