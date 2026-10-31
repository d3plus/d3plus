const icon = (color, size) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='${size}' height='${size}' rx='${size / 8}' fill='${color}'/><circle cx='${size / 2}' cy='${size / 2}' r='${size / 4}' fill='white' fill-opacity='0.85'/></svg>`,
  )}`;

const config = {
  data: [
    {id: "a", x: 120, y: 160, width: 80, height: 80, url: icon("#3a7ca5", 80)},
    {
      id: "b",
      x: 260,
      y: 160,
      width: 120,
      height: 120,
      url: icon("#cc4b4b", 120),
    },
    {id: "c", x: 420, y: 160, width: 60, height: 60, url: icon("#5d6d7e", 60)},
  ],
  opacity: d => (d.id === "c" ? 0.5 : 1),
};
