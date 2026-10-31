const crew = [
  {id: "Ada", team: "Design"},
  {id: "Ben", team: "Engineering"},
  {id: "Cleo", team: "Research"},
  {id: "Dev", team: "Engineering"},
  {id: "Eli", team: "Design"},
  {id: "Fay", team: "Research"},
  {id: "Gus", team: "Engineering"},
  {id: "Hana", team: "Design"},
  {id: "Ivo", team: "Research"},
  {id: "Jun", team: "Engineering"},
];

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
};
