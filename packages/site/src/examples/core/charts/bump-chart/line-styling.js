const teams = ["Hawks", "Otters", "Falcons", "Bears", "Wolves"];

const seasons = [2019, 2020, 2021, 2022, 2023, 2024];

const standings = seasons.flatMap((year, s) =>
  teams.map((team, t) => ({
    team,
    year,
    rank: ((t * 2 + s * 3) % teams.length) + 1,
  })),
);

const config = {
  data: standings,
  discrete: "x",
  groupBy: "team",
  label: d => d.team,
  shapeConfig: {
    Line: {strokeWidth: 6, strokeLinecap: "round"},
    Circle: {r: 9},
  },
  x: "year",
  y: "rank",
};
