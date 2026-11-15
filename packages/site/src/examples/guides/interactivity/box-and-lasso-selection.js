// A fixed scatter of three groups, so the page looks the same on every load.
const data = [];
["Alpha", "Beta", "Gamma"].forEach((group, g) => {
  for (let i = 0; i < 30; i++)
    data.push({
      id: `${group} ${i}`,
      group,
      x: Math.round(((i * 37 + g * 11) % 100) * 10) / 10,
      y: Math.round(((i * 53 + g * 29) % 50) * 10) / 10,
    });
});

const config = {
  data,
  groupBy: ["group", "id"],
  x: "x",
  y: "y",
  selectMode: "lasso",
};
