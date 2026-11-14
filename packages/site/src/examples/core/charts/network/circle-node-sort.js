const teams = [
  ["Platform", ["API", "Data", "Infra", "Security"]],
  ["Product", ["Web", "Mobile", "Design", "Research"]],
  ["Growth", ["Sales", "Marketing", "Support"]],
].flatMap(([team, ids]) => ids.map(id => ({team, id})));

const pairs = [
  ["API", "Data"],
  ["API", "Infra"],
  ["Data", "Infra"],
  ["Infra", "Security"],
  ["Web", "Mobile"],
  ["Web", "Design"],
  ["Design", "Research"],
  ["Mobile", "Design"],
  ["Sales", "Marketing"],
  ["Marketing", "Support"],
  ["API", "Web"],
  ["Data", "Research"],
  ["Support", "Mobile"],
  ["Sales", "Data"],
];

const config = {
  layout: "circle",
  data: teams,
  nodes: teams,
  groupBy: ["team", "id"],
  links: pairs.map(([source, target]) => ({source, target})),
  nodeSort: "label",
  arrows: true,
};
