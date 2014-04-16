//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns distances of all objects in array
//------------------------------------------------------------------------------
d3plus.util.distances = function(arr,accessor) {

  var distances = [], checked = []
  arr.forEach(function(node1){
    var n1 = accessor ? accessor(node1) : [node1.x,node1.y]
    checked.push(node1)
    arr.forEach(function(node2){
      if (checked.indexOf(node2) < 0) {
        var n2 = accessor ? accessor(node2) : [node2.x,node2.y]
          , xx = Math.abs(n1[0]-n2[0])
          , yy = Math.abs(n1[1]-n2[1])
        distances.push(Math.sqrt((xx*xx)+(yy*yy)))
      }
    })

  })

  distances.sort(function(a,b){
    return a - b
  })

  return distances
}
