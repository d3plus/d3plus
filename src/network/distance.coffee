module.exports = (n1, n2) ->
  n1 = [n1.x, n1.y] unless n1 instanceof Array
  n2 = [n2.x, n2.y] unless n2 instanceof Array
  xx = Math.abs n1[0] - n2[0]
  yy = Math.abs n1[1] - n2[1]
  Math.sqrt((xx * xx) + (yy * yy))
