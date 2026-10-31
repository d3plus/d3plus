const config = {
  data: [
    {text: "textAnchor: start", anchor: "start", valign: "top"},
    {text: "textAnchor: middle", anchor: "middle", valign: "middle"},
    {text: "textAnchor: end", anchor: "end", valign: "bottom"},
  ],
  fontSize: 16,
  height: 150,
  text: d => d.text,
  textAnchor: d => d.anchor,
  verticalAlign: d => d.valign,
  width: 200,
  x: (d, i) => i * (200 + 50),
};
