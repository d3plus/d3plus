# Lightens a color
module.exports = (color, increment) ->
  increment = 0.5 if increment is undefined
  c = d3.hsl(color)
  increment = (1 - c.l) * increment
  c.l += increment
  c.s -= increment
  c.toString()
