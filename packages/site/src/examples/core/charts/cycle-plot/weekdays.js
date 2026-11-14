// Daily bike trips at two stations over 16 weeks: one busy on weekdays,
// the other on weekends.
const stations = [
  {name: "Union Station", weekday: 420, weekend: 180},
  {name: "Riverside Park", weekday: 160, weekend: 390},
];
const trips = [];
for (let day = 0; day < 16 * 7; day++) {
  const date = new Date(2024, 2, 4 + day);
  const weekend = [0, 6].includes(date.getDay());
  stations.forEach((station, k) => {
    const base = weekend ? station.weekend : station.weekday;
    trips.push({
      station: station.name,
      date: `2024-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      trips: Math.round(base * (1 + day / 300) + Math.sin(day * 1.7 + k) * 25),
    });
  });
}

const config = {
  data: trips,
  groupBy: "station",
  period: "weekday",
  x: "date",
  y: "trips",
};
