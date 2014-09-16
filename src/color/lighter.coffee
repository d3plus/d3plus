# Lightens a color
module.exports = (color, increment) ->
  increment = 0.5  if increment is undefined
  c = d3.hsl(color)
  c.l += (1 - c.l) * increment
  c.toString()
