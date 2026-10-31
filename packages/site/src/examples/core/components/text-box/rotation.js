const config = {
  data: [
    {text: "rotate: -45", rotate: -45},
    {text: "rotate: 0", rotate: 0},
    {text: "rotate: 90", rotate: 90},
  ],
  fontSize: 16,
  height: 60,
  rotate: d => d.rotate,
  text: d => d.text,
  width: 140,
  x: (d, i) => 60 + i * 220,
  y: 80,
};
