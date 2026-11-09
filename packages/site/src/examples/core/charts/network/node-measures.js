const people = "Ada Ben Cleo Dev Eli Fay Gus Hana Ivo Jun".split(" ");

const pairs = [
  ["Ada", "Ben", 6],
  ["Ada", "Cleo", 4],
  ["Ben", "Cleo", 5],
  ["Cleo", "Dev", 2],
  ["Ben", "Dev", 3],
  ["Dev", "Eli", 1],
  ["Eli", "Fay", 1],
  ["Fay", "Gus", 7],
  ["Fay", "Hana", 5],
  ["Gus", "Hana", 3],
  ["Gus", "Ivo", 4],
  ["Hana", "Jun", 2],
  ["Ivo", "Jun", 5],
];

const config = {
  nodes: people.map(id => ({id})),
  links: pairs.map(([source, target, papers]) => ({source, target, papers})),
  linkSize: d => d.papers,
  nodeTooltipStats: true,
  nodeTooltipStatsConfig: {weighted: false},
};
