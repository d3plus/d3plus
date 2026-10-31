const gradient = (a, b) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="20"><linearGradient id="g"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><rect width="400" height="20" fill="url(#g)"/></svg>`,
  )}`;

const config = {
  data: [
    {id: "Lines", value: 64, target: 75, forecast: 80, texture: "lines"},
    {id: "Crosses", value: 81, target: 75, texture: "crosses"},
    {
      id: "Gradient",
      value: 58,
      target: 70,
      forecast: 66,
      colors: ["#1c7ed6", "#e64980"],
    },
    {id: "Plain", value: 47, target: 60},
  ],
  bands: [50, 75],
  domain: [0, 100],
  measureSize: 0.5,
  shapeConfig: {
    texture: d => d.texture || false,
    backgroundImage: d => (d.colors ? gradient(...d.colors) : false),
  },
};
