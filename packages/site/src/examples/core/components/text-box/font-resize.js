const config = {
  data: [
    {text: "Big"},
    {text: "A medium-length caption"},
    {
      text: "A much longer passage of text that has to shrink down so every word still fits inside the very same box",
    },
  ],
  fontResize: true,
  fontMax: 96,
  fontMin: 6,
  height: 180,
  text: d => d.text,
  width: 200,
  x: (d, i) => i * (200 + 50),
};
