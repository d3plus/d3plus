offset = require "../geom/offset.coffee"

module.exports = (path) ->

  return [] unless path
  path = path.slice(1).slice(0,-1).split(/L|A/)
  poly = []

  for p in path
    p = p.split(" ")
    if p.length is 1
      poly.push p[0].split(",").map (d) -> parseFloat d
    else
      prev = poly[poly.length-1]
      last = p.pop().split(",").map (d) -> parseFloat d
      radius = parseFloat p.shift().split(",")[0]
      width = Math.sqrt( Math.pow(last[0]-prev[0],2) + Math.pow(last[1]-prev[1],2) )
      angle = Math.acos((radius*radius+radius*radius-width*width)/(2*radius*radius))
      obtuse = p[1].split(",")[0] is "1"
      angle = Math.PI*2 - angle if obtuse
      length = angle/(Math.PI*2) * (radius*Math.PI*2)
      segments = length/5
      start = Math.atan2(-prev[1],-prev[0]) - Math.PI
      step = angle/segments
      i = step
      while i < angle
        o = offset start + i, radius
        poly.push [o.x,o.y]
        i += step
      poly.push last

  poly
