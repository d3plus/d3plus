const teams = ["Research", "Design", "Sales", "Support"];
const nodes = [];
const links = [];
for (let i = 0; i < 32; i++) {
  nodes.push({id: `P${i + 1}`, team: teams[i % teams.length]});
  // Each person works with someone who joined before them, and most with
  // someone on their own team too.
  if (i) links.push({source: `P${i + 1}`, target: `P${Math.floor(i / 2) + 1}`});
  if (i > 4 && i % 3) links.push({source: `P${i + 1}`, target: `P${i - 3}`});
}

const config = {
  nodes,
  links,
  color: "team",
};
