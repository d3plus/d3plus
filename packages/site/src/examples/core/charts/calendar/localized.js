const activity = (start, end, repos = ["core"]) => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pad = n => String(n).padStart(2, "0");
  const rows = [];
  for (
    let d = new Date(...start);
    d <= new Date(...end);
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const season = 1 + 0.6 * Math.sin((d.getMonth() / 12) * Math.PI * 2);
    repos.forEach((repo, r) => {
      if (random() > (weekend ? 0.25 : 0.8) / (r + 1)) return;
      const commits = Math.max(
        1,
        Math.round(random() * 9 * season * (weekend ? 0.4 : 1)),
      );
      rows.push({date, repo, commits});
    });
  }
  return rows;
};

const twoYears = activity([2024, 0, 1], [2025, 11, 31]);

const oneYear = twoYears.filter(d => d.date >= "2025");

const config = {
  data: oneYear,
  colorScale: "commits",
  locale: "es-ES",
};
