const constellation = [
  ["Hub", 0, 0, 120],
  ["Aster", -1.1, -0.9, 6],
  ["Briar", -0.6, -1.3, 4],
  ["Clove", 0.3, -1.4, 8],
  ["Dahlia", 1.0, -1.0, 5],
  ["Elder", 1.4, -0.2, 3],
  ["Fennel", 1.3, 0.6, 7],
  ["Ginger", 0.7, 1.2, 4],
  ["Hazel", -0.1, 1.4, 6],
  ["Iris", -0.9, 1.1, 3],
  ["Juniper", -1.4, 0.4, 5],
  ["Kale", -1.5, -0.3, 4],
  ["Laurel", 0.45, -0.75, 3],
  ["Mallow", 0.6, -0.55, 2],
  ["Nettle", -0.5, 0.65, 3],
];

const config = {
  nodes: constellation.map(([id, x, y, value]) => ({id, x, y, value})),
  links: constellation.slice(1).map(([id], i) => ({
    source: i % 3 ? constellation[i][0] : "Hub",
    target: id,
  })),
  size: "value",
  sizeMin: 5,
  sizeMax: 50,
  labelPosition: "auto",
};
