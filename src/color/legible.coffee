# Darkens a color if it's too light to appear on white
module.exports = (color) ->
  hsl = d3.hsl color
  if hsl.l > .45
    hsl.s = 0.8 if hsl.s > .8
    hsl.l = 0.45
  hsl.toString()
