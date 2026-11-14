const data = [
  ["Engineering", "Platform", ["API", "Data", "Infrastructure"]],
  ["Engineering", "Product", ["Web", "Mobile", "Design Systems"]],
  ["Operations", "Finance", ["Accounting", "Payroll"]],
  ["Operations", "People", ["Recruiting", "Benefits", "Training"]],
  ["Sales", "Field", ["East", "West", "Central"]],
  ["Sales", "Partners", ["Resellers", "Alliances"]],
].flatMap(([division, group, teams]) =>
  teams.map(team => ({company: "Company", division, group, team})),
);

const config = {
  data,
  groupBy: ["company", "division", "group", "team"],
};
