const config = {
  nodeId: "key",
  label: d => d.name,
  value: "value",
  nodes: [
    {key: "eng", name: "Engineering"},
    {key: "sls", name: "Sales"},
    {key: "sup", name: "Support"},
    {key: "ops", name: "Operations"},
  ],
  links: [
    {source: "eng", target: "sup", value: 6},
    {source: "sls", target: "sup", value: 4},
    {source: "sup", target: "eng", value: 3},
  ],
};
