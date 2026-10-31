const bands = [
  {max: 60, color: "#2f9e44"},
  {max: 85, color: "#f59f00"},
  {color: "#e03131"},
];

const config = {
  data: [{id: "CPU", value: 64}],
  domain: [0, 100],
  bands,
  indicator: "progress",
  valueFormat: d => `${d}%`,
};
