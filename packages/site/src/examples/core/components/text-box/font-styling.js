const config = {
  data: [
    {
      text: "Georgia, bold, slate",
      family: "Georgia, serif",
      weight: 700,
      color: "#495057",
    },
    {
      text: "Inter, regular, blue",
      family: "Inter, sans-serif",
      weight: 400,
      color: "#1c7ed6",
    },
    {
      text: "Monospace with a stroke",
      family: "ui-monospace, monospace",
      weight: 600,
      color: "#fff",
    },
  ],
  fontColor: d => d.color,
  fontFamily: d => d.family,
  fontSize: 18,
  fontStroke: d => (d.weight === 600 ? "#212529" : "none"),
  fontStrokeWidth: 1,
  fontWeight: d => d.weight,
  height: 80,
  text: d => d.text,
  width: 200,
  x: (d, i) => i * (200 + 50),
};
