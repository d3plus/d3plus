// 50,000 readings, one a second, with a few sharp spikes.
const data = [];
let level = 50;
for (let i = 0; i < 50000; i++) {
  level += Math.sin(i / 400) * 0.05 + (((i * 7919) % 1000) / 1000 - 0.5) * 0.8;
  const spike = i % 12007 === 6000 ? 30 : 0;
  data.push({
    id: "Sensor",
    time: new Date(Date.UTC(2026, 0, 1) + i * 1000),
    value: level + spike,
  });
}

const config = {
  data,
  groupBy: "id",
  x: "time",
  y: "value",
  xConfig: {scale: "time"},
  downsample: true,
};
