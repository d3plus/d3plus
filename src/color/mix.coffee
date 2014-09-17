# Mixes 2 colors with optional opacities
module.exports = (c1, c2, o1, o2) ->
  o1 = 1 unless o1
  o2 = 1 unless o2
  c1 = d3.rgb(c1)
  c2 = d3.rgb(c2)
  r = (o1 * c1.r + o2 * c2.r - o1 * o2 * c2.r) / (o1 + o2 - o1 * o2)
  g = (o1 * c1.g + o2 * c2.g - o1 * o2 * c2.g) / (o1 + o2 - o1 * o2)
  b = (o1 * c1.b + o2 * c2.b - o1 * o2 * c2.b) / (o1 + o2 - o1 * o2)
  d3.rgb(r, g, b).toString()
