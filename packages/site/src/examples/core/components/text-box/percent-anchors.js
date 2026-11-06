const config = {
  data: [
    {text: "0% matches start", anchor: "0%"},
    {text: "25% of the way across the box", anchor: "25%"},
    {text: "50% matches middle", anchor: "50%"},
    {text: "75% of the way across the box", anchor: "75%"},
    {text: "100% matches end", anchor: "100%"},
  ],
  fontSize: 14,
  height: 30,
  text: d => d.text,
  textAnchor: d => d.anchor,
  width: 400,
  y: (d, i) => i * 30,
};
