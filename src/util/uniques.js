//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//------------------------------------------------------------------------------
d3plus.util.uniques = function( data , value ) {

  if ( data === undefined || value === undefined ) {
    return []
  }

  var type = false

  return d3.nest()
    .key(function(d) {

      if ( d3plus.object.validate(d) && typeof value === "string" ) {
        var val = d[value]
      }
      else if ( typeof value === "function" ) {
        var val = value(d)
      }
      else {
        var val = d
      }

      if (!type) type = typeof val
      return val

    })
    .entries(data)
    .reduce(function( a , b ){

      if (b.key === "undefined") return a

      if (type === "number") var val = parseFloat(b.key)
      else var val = b.key

      return a.concat(val)

    }, [] ).sort(function(a,b){return a-b})

}
