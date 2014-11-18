# Returns distances of all objects in array
module.exports = (arr, accessor) ->

  distance = false
  quad = d3.geom.quadtree()
    .x (d) -> if accessor then accessor(d)[0] else d.x
    .y (d) -> if accessor then accessor(d)[1] else d.y

  quad(arr).visit (node) ->
    unless node.leaf
      for n1 in node.nodes
        if n1 and n1.point
          node1 = n1.point
          for n2 in node.nodes
            if n2 and n2.point and n2.point isnt node1
              node2 = n2.point
              xx = Math.abs node1.x - node2.x
              yy = Math.abs node1.y - node2.y
              d = Math.sqrt((xx * xx) + (yy * yy))
              distance = d if distance is false or d < distance
    false

  distance
