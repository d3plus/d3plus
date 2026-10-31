const long =
  "This passage is much longer than the two lines its box allows, so the wrapper has to decide what to do with the remainder.";

const config = {
  data: [
    {text: `height: 48 — ${long}`, maxLines: null},
    {text: `maxLines: 1 — ${long}`, maxLines: 1},
  ],
  fontSize: 15,
  height: 48,
  maxLines: d => d.maxLines,
  text: d => d.text,
  width: 240,
  x: (d, i) => i * (240 + 40),
};
