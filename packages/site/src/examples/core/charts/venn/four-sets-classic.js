const fruit = [
  {sets: ["Apples"], size: 120},
  {sets: ["Bananas"], size: 110},
  {sets: ["Cherries"], size: 90},
  {sets: ["Dates"], size: 60},
  {sets: ["Apples", "Bananas"], size: 45},
  {sets: ["Apples", "Cherries"], size: 30},
  {sets: ["Apples", "Dates"], size: 15},
  {sets: ["Bananas", "Cherries"], size: 35},
  {sets: ["Bananas", "Dates"], size: 20},
  {sets: ["Cherries", "Dates"], size: 18},
  {sets: ["Apples", "Bananas", "Cherries"], size: 12},
  {sets: ["Apples", "Bananas", "Dates"], size: 8},
  {sets: ["Apples", "Cherries", "Dates"], size: 6},
  {sets: ["Bananas", "Cherries", "Dates"], size: 7},
  {sets: ["Apples", "Bananas", "Cherries", "Dates"], size: 4},
];

const config = {
  data: fruit,
  proportional: false,
};
