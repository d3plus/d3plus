//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds closest numeric value in array
//------------------------------------------------------------------------------
d3plus.util.closest = function(arr,value) {
  var closest = arr[0]
  arr.forEach(function(p){
    if (Math.abs(value-p) < Math.abs(value-closest)) {
      closest = p
    }
  })
  return closest
}
