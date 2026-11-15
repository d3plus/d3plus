// Sets and sizes can live under any keys: `sets` and `value` name them.
const survey = [
  {tools: "Figma", people: 64},
  {tools: "Sketch", people: 28},
  {tools: ["Figma", "Sketch"], people: 15},
];

const config = {
  data: survey,
  sets: "tools",
  value: "people",
  valueFormat: n => `${n} people`,
};
