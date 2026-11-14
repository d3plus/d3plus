const parties = [
  "Left Alliance",
  "Social Democrats",
  "Greens",
  "Centre",
  "Liberals",
  "Conservatives",
  "National Party",
];
const results = {
  2019: [28, 102, 41, 36, 52, 141, 50],
  2023: [22, 118, 58, 30, 41, 126, 55],
};

const config = {
  data: Object.entries(results).flatMap(([election, seats]) =>
    parties.map((party, i) => ({party, election, seats: seats[i]})),
  ),
  facet: "election",
  groupBy: "party",
  sum: "seats",
};
