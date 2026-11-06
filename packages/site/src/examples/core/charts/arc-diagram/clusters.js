const crew = "Ada Ben Cleo Dev Eli Fay Gus Hana Ivo Jun"
  .split(" ")
  .map(id => ({id}));

const meetings = [
  {source: "Ada", target: "Eli", count: 9},
  {source: "Ada", target: "Hana", count: 6},
  {source: "Eli", target: "Hana", count: 4},
  {source: "Ben", target: "Dev", count: 8},
  {source: "Ben", target: "Gus", count: 5},
  {source: "Dev", target: "Jun", count: 7},
  {source: "Gus", target: "Jun", count: 3},
  {source: "Cleo", target: "Fay", count: 6},
  {source: "Fay", target: "Ivo", count: 5},
  {source: "Ada", target: "Ben", count: 2},
  {source: "Hana", target: "Cleo", count: 3},
  {source: "Jun", target: "Ivo", count: 2},
  {source: "Eli", target: "Dev", count: 1},
];

const config = {
  nodes: crew,
  links: meetings,
  nodeSort: "group",
  linkSize: d => d.count,
};
