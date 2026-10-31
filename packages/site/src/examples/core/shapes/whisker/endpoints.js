const config = {
  data: [
    {id: "a", x: 120, y: 160, endpoint: "Rect", orient: "top"},
    {id: "b", x: 260, y: 160, endpoint: "Circle", orient: "top"},
    {id: "c", x: 400, y: 160, endpoint: "Rect", orient: "right"},
    {id: "d", x: 540, y: 160, endpoint: "Circle", orient: "bottom"},
  ],
  endpoint: d => d.endpoint,
  endpointConfig: {Circle: {r: 7}, Rect: {width: 24, height: 6}},
  length: 80,
  orient: d => d.orient,
  x: d => d.x,
  y: d => d.y,
};
