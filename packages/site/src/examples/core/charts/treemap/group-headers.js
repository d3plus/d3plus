const data = [
  {sector: "Technology", industry: "Software", company: "Northwind", cap: 92},
  {sector: "Technology", industry: "Software", company: "Bluefin", cap: 61},
  {sector: "Technology", industry: "Software", company: "Quanta", cap: 34},
  {sector: "Technology", industry: "Chips", company: "Silicon Ridge", cap: 78},
  {sector: "Technology", industry: "Chips", company: "Nanocore", cap: 29},
  {sector: "Healthcare", industry: "Pharma", company: "Helix", cap: 66},
  {sector: "Healthcare", industry: "Pharma", company: "Medora", cap: 31},
  {sector: "Healthcare", industry: "Devices", company: "Pulse", cap: 44},
  {sector: "Financial", industry: "Banks", company: "First Harbor", cap: 58},
  {sector: "Financial", industry: "Banks", company: "Granite", cap: 37},
  {sector: "Financial", industry: "Insurance", company: "Shield", cap: 41},
  {sector: "Energy", industry: "Oil & Gas", company: "Basin", cap: 33},
  {sector: "Energy", industry: "Renewables", company: "Solstice", cap: 21},
];

const config = {
  data,
  groupBy: ["sector", "industry", "company"],
  groupLabelConfig: {fill: "#343a40", fontSize: 12},
  sum: "cap",
};
