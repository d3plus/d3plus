###*
 * Returns distances of all objects in array
 ###
d3plus.util.distances = (arr, accessor) ->

  distances = []
  checked = []

  arr.forEach (node1) ->
    n1 = (if accessor then accessor(node1) else [ node1.x, node1.y ])
    checked.push node1
    arr.forEach (node2) ->
      if checked.indexOf(node2) < 0
        n2 = (if accessor then accessor(node2) else [ node2.x, node2.y ])
        xx = Math.abs(n1[0] - n2[0])
        yy = Math.abs(n1[1] - n2[1])
        distances.push Math.sqrt((xx * xx) + (yy * yy))

  distances.sort (a, b) -> a - b

  distances
