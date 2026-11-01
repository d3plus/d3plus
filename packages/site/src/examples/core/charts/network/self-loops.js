const config = {
  nodes: [
    {id: "hub"},
    {id: "alpha"},
    {id: "beta"},
    {id: "gamma"},
    {id: "delta"},
  ],
  links: [
    {source: "hub", target: "alpha", trips: 6},
    {source: "hub", target: "beta", trips: 4},
    {source: "hub", target: "gamma", trips: 3},
    {source: "gamma", target: "delta", trips: 2},
    {source: "hub", target: "hub", trips: 8},
    {source: "hub", target: "hub", trips: 2},
    {source: "delta", target: "delta", trips: 5},
  ],
  linkSize: d => d.trips,
  linkLabel: d => d.trips,
  arrows: true,
};
