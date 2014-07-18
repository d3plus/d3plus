//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//------------------------------------------------------------------------------
d3plus.util.uniques = function( data , value ) {

  if ( data === undefined || value === undefined ) {
    return []
  }

  var type = typeof value

  return d3.nest()
    .key(function(d) {

      if ( d3plus.object.validate(d) && type === "string" ) {
        return d[value]
      }
      else if ( type === "function" ) {
        return value(d)
      }
      else {
        return d
      }

    })
    .entries(data)
    .reduce(function( a , b ){

      return b.key !== "undefined" ? a.concat(b.key) : a

    }, [] )

}
