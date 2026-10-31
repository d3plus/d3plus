const config = {
  data: [
    {id: "Agriculture, Forestry and Fishing", value: 20},
    {id: "Mining and Quarrying", value: 57},
    {id: "Manufacturing", value: 94},
    {id: "Electricity and Gas Supply", value: 41},
    {id: "Water Supply and Sewerage", value: 78},
    {id: "Construction", value: 25},
    {id: "Wholesale and Retail Trade", value: 62},
    {id: "Transportation and Storage", value: 99},
  ],
  groupBy: "id",
  legend: false,
  shapeConfig: {Bar: {label: false}},
  x: "id",
  xConfig: {labelRotation: -45},
  y: "value",
};
