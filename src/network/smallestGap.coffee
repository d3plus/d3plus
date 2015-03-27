distance = require "./distance.coffee"

# Returns distances of all objects in array
module.exports = (arr, opts) ->

  opts      = {} unless opts
  distances = []

  quad = d3.geom.quadtree()
    .x (d) -> if opts.accessor then opts.accessor(d)[0] else d[0]
    .y (d) -> if opts.accessor then opts.accessor(d)[1] else d[1]

  quad(arr).visit (node) ->
    unless node.leaf
      for n1 in node.nodes
        if n1 and n1.point
          if opts.origin
            distances.push(distance n1, opts)
          else
            for n2 in node.nodes
              if n2 and n2.point and n2.point isnt n1.point
                distances.push(distance n1, n2)
    false

  if opts.all then distances.sort((aa, bb) -> aa-bb) else d3.min distances
