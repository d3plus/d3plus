const config = {
  data: [
    {
      text: "Text follows an arc from end to end",
      path: "M20,160 A140,120 0 0 1 300,160",
    },
    {
      text: "A wave carries the words up and down",
      path: "M330,110 C380,40 430,180 480,110 S580,40 610,110",
    },
  ],
  fontSize: 16,
  side: "left",
  startOffset: 0,
  text: d => d.text,
  textAnchor: "middle",
  textPath: d => d.path,
};
