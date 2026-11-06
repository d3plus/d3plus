const countries = ["United States", "Brazil", "Germany", "India"];
const data = countries.flatMap((id, k) =>
  Array.from({length: 25}, (_, t) => ({
    id,
    year: 2000 + t,
    value: 30 + k * 18 + 8 * Math.sin(t / (3 + k) + k) + t * (k - 1.5),
  })),
);

const config = {
  data,
  groupBy: "id",
  lineLabels: "along",
  shapeConfig: {Line: {curve: "monotoneX"}},
  x: "year",
  y: "value",
};
