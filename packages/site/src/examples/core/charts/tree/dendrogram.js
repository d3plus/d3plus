// The distance at which a hierarchical clustering merged each group.
const merged = {
  All: 9,
  Warm: 4,
  Cool: 6,
  Reds: 1.5,
  Yellows: 2.5,
  Blues: 2,
  Greens: 3,
};

const data = [
  ["Warm", "Reds", ["Rose", "Ruby"]],
  ["Warm", "Yellows", ["Gold", "Lemon"]],
  ["Cool", "Blues", ["Navy", "Azure"]],
  ["Cool", "Greens", ["Jade", "Mint"]],
].flatMap(([temperature, family, colors]) =>
  colors.map(name => ({all: "All", temperature, family, name})),
);

const config = {
  data,
  groupBy: ["all", "temperature", "family", "name"],
  nodeHeight: (d, i, node) => merged[node.id] ?? 0,
};
