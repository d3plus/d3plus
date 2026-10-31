const config = {
  data: [
    {id: "a", x: 40, y: 120},
    {id: "a", x: 200, y: 200},
    {id: "a", x: 360, y: 90},
    {id: "a", x: 520, y: 180},
    {id: "a", x: 680, y: 110},
    {id: "b", x: 40, y: 220},
    {id: "b", x: 200, y: 150},
    {id: "b", x: 360, y: 240},
    {id: "b", x: 520, y: 130},
    {id: "b", x: 680, y: 210},
  ],
  curve: "monotoneX",
  fill: d => (d.id === "a" ? "#3a7ca5" : "#cc4b4b"),
  fillOpacity: 0.45,
};
