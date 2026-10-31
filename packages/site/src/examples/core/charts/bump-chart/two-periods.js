const config = {
  data: [
    {team: "Falcons", year: 2023, rank: 1},
    {team: "Falcons", year: 2024, rank: 3},
    {team: "Hawks", year: 2023, rank: 2},
    {team: "Hawks", year: 2024, rank: 1},
    {team: "Owls", year: 2023, rank: 3},
    {team: "Owls", year: 2024, rank: 4},
    {team: "Ravens", year: 2023, rank: 4},
    {team: "Ravens", year: 2024, rank: 2},
  ],
  groupBy: "team",
  discrete: "x",
  x: "year",
  y: "rank",
};
