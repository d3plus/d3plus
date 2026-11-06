// Three teams of ten, each placed in a ring, and the messages between
// them: every person writes to a few people on each of the other teams.
const teams = [
  {team: "Design", x: 0, y: -12},
  {team: "Engineering", x: -11, y: 7},
  {team: "Research", x: 11, y: 7},
];
const nodes = teams.flatMap(({team, x, y}) =>
  Array.from({length: 10}, (_, k) => {
    const angle = (k / 10) * 2 * Math.PI;
    return {
      id: `${team} ${k + 1}`,
      team,
      x: x + Math.cos(angle) * 4,
      y: y + Math.sin(angle) * 4,
    };
  }),
);
const links = [];
nodes.forEach((a, i) =>
  nodes.forEach((b, j) => {
    if (a.team < b.team && (i * 7 + j * 3) % 4 === 0)
      links.push({source: a.id, target: b.id});
  }),
);

const config = {
  nodes,
  links,
  color: "team",
  sizeMax: 8,
  linkBundle: true,
  linkBundleConfig: {strength: 0.85},
};
