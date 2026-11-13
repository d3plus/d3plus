const load = (() => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const servers = ["api", "auth", "billing", "search", "web"];
  return servers.flatMap((server, s) => {
    let level = 40 + s * 8;
    return Array.from({length: 90}, (_, day) => {
      level += (random() - 0.5) * 12 + (40 + s * 8 - level) * 0.08;
      return {
        server,
        date: new Date(Date.UTC(2024, 0, 1 + day * 4)),
        "CPU Load (%)": Math.round(level * 10) / 10,
      };
    });
  });
})();

const config = {
  data: load,
  groupBy: "server",
  time: "date",
  timeline: false,
  x: "date",
  y: "CPU Load (%)",
};
