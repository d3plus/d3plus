//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//------------------------------------------------------------------------------
d3plus.util.uniques = function(data,value) {

  if (data === undefined) {
    return []
  }

  var type = null
  
  return d3.nest().key(function(d) {
      if (typeof value == "string") {
        if (!type && typeof d[value] !== "undefined") type = typeof d[value]
        return d[value]
      }
      else if (typeof value == "function") {
        if (!type && typeof value(d) !== "undefined") type = typeof value(d)
        return value(d)
      }
      else {
        return d
      }
    })
    .entries(data)
    .reduce(function(a,b){
      if (type) {
        var val = b.key
        if (type == "number") val = parseFloat(val)
        return a.concat(val)
      }
      return a
    },[]).sort(function(a,b){
      return a - b
    })

}
