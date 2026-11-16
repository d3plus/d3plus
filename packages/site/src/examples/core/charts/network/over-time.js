// A collaboration network growing year by year: each node row and each
// link names the year it belongs to.
const teams = ["Research", "Design", "Sales", "Support"];
const nodes = [];
const links = [];
for (let year = 2019; year <= 2023; year++) {
  const count = 8 + (year - 2019) * 6;
  for (let i = 0; i < count; i++) {
    nodes.push({id: `P${i + 1}`, team: teams[i % teams.length], year});
    if (i)
      links.push({
        source: `P${i + 1}`,
        target: `P${Math.floor(i / 2) + 1}`,
        year,
      });
    if (i > 4 && i % 3 === year % 3)
      links.push({source: `P${i + 1}`, target: `P${i - 4}`, year});
  }
}

const config = {
  nodes,
  links,
  color: "team",
  // The same node size every year, however many people there are.
  sizeMax: 12,
  time: "year",
  timelineConfig: {brushing: false},
  timelineDefault: [2019],
};
