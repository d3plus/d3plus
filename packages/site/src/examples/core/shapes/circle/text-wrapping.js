const config = {
  data: [
    {
      id: "big",
      x: 170,
      y: 170,
      r: 150,
      fill: "#3a7ca5",
      text: "Data visualization made easy — labels wrap to fill the whole circle, with shorter lines near the top and bottom.",
    },
    {
      id: "small",
      x: 430,
      y: 170,
      r: 100,
      fill: "#cc4b4b",
      text: "Text follows the curve instead of a boxy square inside the circle.",
    },
  ],
  x: "x",
  y: "y",
  r: "r",
  fill: d => d.fill,
  label: d => d.text,
};
