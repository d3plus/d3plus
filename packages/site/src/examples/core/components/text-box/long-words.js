const config = {
  data: [
    {text: "overflow: false ABCDEFGHIJKLMNOPQRSTUVWXYZ", overflow: false},
    {text: "overflow: true ABCDEFGHIJKLMNOPQRSTUVWXYZ", overflow: true},
  ],
  fontSize: 16,
  height: 80,
  overflow: d => d.overflow,
  text: d => d.text,
  width: 150,
  x: (d, i) => i * (150 + 120),
};
