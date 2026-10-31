const bands = [
  {max: 60, color: "#2f9e44"},
  {max: 85, color: "#f59f00"},
  {color: "#e03131"},
];

const config = {
  data: [
    {id: "Memory", value: 48},
    {id: "CPU", value: 72},
    {id: "Disk", value: 91},
  ],
  domain: [0, 100],
  bands,
  indicator: "progress",
};
