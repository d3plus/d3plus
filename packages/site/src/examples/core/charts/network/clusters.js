const people = "Ada Ben Cleo Dev Eli Fay Gus Hana Ivo Jun Kai Lea Mo Nia Omar"
  .split(" ")
  .map(id => ({id}));

const pairs = [
  ["Ada", "Ben", 6],
  ["Ada", "Cleo", 4],
  ["Ben", "Cleo", 5],
  ["Ada", "Dev", 3],
  ["Cleo", "Dev", 2],
  ["Dev", "Eli", 4],
  ["Ben", "Eli", 2],
  ["Fay", "Gus", 7],
  ["Fay", "Hana", 5],
  ["Gus", "Hana", 3],
  ["Gus", "Ivo", 4],
  ["Hana", "Ivo", 2],
  ["Ivo", "Jun", 5],
  ["Fay", "Jun", 2],
  ["Kai", "Lea", 6],
  ["Kai", "Mo", 4],
  ["Lea", "Mo", 3],
  ["Mo", "Nia", 5],
  ["Lea", "Nia", 2],
  ["Nia", "Omar", 4],
  ["Kai", "Omar", 3],
  ["Eli", "Fay", 1],
  ["Jun", "Kai", 1],
  ["Omar", "Ada", 1],
];

const config = {
  nodes: people,
  links: pairs.map(([source, target, papers]) => ({source, target, papers})),
  linkSize: d => d.papers,
};
