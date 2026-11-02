const config = {
  nodes: [
    {id: "budget"},
    {id: "salaries"},
    {id: "equipment"},
    {id: "research"},
    {id: "travel"},
    {id: "reserve", value: 4},
    {id: "pending"},
  ],
  links: [
    {source: "budget", target: "salaries", value: 10},
    {source: "budget", target: "equipment", value: 3},
    {source: "budget", target: "research", value: 6},
    {source: "research", target: "travel", value: 2},
  ],
  value: "value",
};
