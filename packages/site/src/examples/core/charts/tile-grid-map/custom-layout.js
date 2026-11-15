// Populations in millions (2022), keyed by the countries' ISO numeric codes.
const data = [
  {id: 352, country: "Iceland", population: 0.4},
  {id: 578, country: "Norway", population: 5.5},
  {id: 752, country: "Sweden", population: 10.5},
  {id: 246, country: "Finland", population: 5.6},
  {id: 826, country: "United Kingdom", population: 67.6},
  {id: 208, country: "Denmark", population: 5.9},
  {id: 233, country: "Estonia", population: 1.3},
  {id: 372, country: "Ireland", population: 5.1},
  {id: 428, country: "Latvia", population: 1.9},
  {id: 440, country: "Lithuania", population: 2.8},
];

const config = {
  data,
  groupBy: "id",
  label: d => d.country,
  colorScale: "population",
  // Each country's [column, row]; odd rows sit half a tile to the right.
  tileGrid: {
    352: [0, 0],
    578: [2, 0],
    752: [3, 0],
    246: [4, 0],
    826: [1, 1],
    208: [2, 1],
    233: [4, 1],
    372: [0, 2],
    428: [4, 2],
    440: [4, 3],
  },
};
