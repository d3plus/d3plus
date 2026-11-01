const config = {
  nodes: [{id: "a"}, {id: "b"}, {id: "c"}, {id: "d"}, {id: "e"}],
  links: [
    {source: "a", target: "c", value: 3},
    {source: "b", target: "e", value: 1},
    {source: "d", target: "a", value: 4},
    {source: "b", target: "b", value: 5},
    {source: "b", target: "b", value: 2},
    {source: "e", target: "e", value: 3},
  ],
  linkSize: d => d.value,
  linkLabel: d => d.value,
  arcSide: "both",
  arrows: true,
};
