//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//------------------------------------------------------------------------------
d3plus.util.uniques = function( data , value ) {

  if ( data === undefined || value === undefined ) {
    return []
  }

  var type = false
    , nest = d3.nest()
        .key(function(d) {

          if (typeof value === "string") {
            if ( !type && typeof d[value] !== "undefined" ) type = typeof d[value]
            return d[value]
          }
          else if (typeof value === "function") {
            if ( !type && typeof value(d) !== "undefined" ) type = typeof value(d)
            return value(d)
          }
          else {
            return d
          }

        })
        .entries(data)
        .reduce(function( a , b ){

          return type && b.key !== "undefined"
               ? a.concat( type === "number" ? parseFloat(b.key) : b.key )
               : a

        }, [] )

  if ( type === "number" ) {
    nest.sort(function( a , b ){

      return a < b ? -1 : 1

    })
  }

  return nest

}
