const house = [
  {party: "Left Alliance", seats: 22},
  {party: "Social Democrats", seats: 118},
  {party: "Greens", seats: 58},
  {party: "Centre", seats: 30},
  {party: "Liberals", seats: 41},
  {party: "Conservatives", seats: 126},
  {party: "National Party", seats: 55},
];

const config = {
  data: house,
  endAngle: 120,
  groupBy: "party",
  innerRadius: outer => outer * 0.5,
  rings: 6,
  startAngle: -120,
  sum: "seats",
};
