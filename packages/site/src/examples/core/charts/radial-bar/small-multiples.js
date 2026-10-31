const config = {
  data: ["2024", "2025", "2026"].flatMap((year, y) =>
    ["Design", "Engineering", "Marketing", "Sales", "Support"].map(
      (team, t) => ({
        year,
        team,
        people: (y + 1) * (8 + ((y * 11 + t * 7) % 30)),
      }),
    ),
  ),
  groupBy: "team",
  value: "people",
  facet: "year",
};
