const packData = [
  {group: "A", id: "a1", value: 10},
  {group: "A", id: "a2", value: 20},
  {group: "A", id: "a3", value: 15},
  {group: "B", id: "b1", value: 8},
  {group: "B", id: "b2", value: 18},
  {group: "B", id: "b3", value: 12},
  {group: "C", id: "c1", value: 22},
  {group: "C", id: "c2", value: 9},
];

const config = {
  data: packData,
  groupBy: ["group", "id"],
  layoutPadding: 12,
  sum: "value",
};
