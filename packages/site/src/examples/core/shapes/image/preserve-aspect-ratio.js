// A 2:1 picture in three square boxes, each fit its own way.
const picture = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100'><rect width='100' height='100' fill='#3a7ca5'/><rect x='100' width='100' height='100' fill='#cc4b4b'/><circle cx='100' cy='50' r='30' fill='#f5d76e'/></svg>",
)}`;

const config = {
  data: [
    {id: "meet", x: 40, y: 90, width: 140, height: 140, url: picture},
    {id: "slice", x: 220, y: 90, width: 140, height: 140, url: picture},
    {id: "none", x: 400, y: 90, width: 140, height: 140, url: picture},
  ],
  // Unset, an image fits inside its box, centered ("xMidYMid meet").
  preserveAspectRatio: d =>
    d.id === "slice" ? "xMinYMid slice" : d.id === "none" ? "none" : undefined,
};
