//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sorts an array of objects
//------------------------------------------------------------------------------
d3plus.array.sort = function( arr , keys , sort , colors , vars ) {

  if ( !arr || arr.length <= 1 || !keys ) {
    return arr || []
  }

  if ( !sort ) {
    var sort = "asc"
  }

  if ( !(keys instanceof Array) ) {
    keys = [ keys ]
  }

  if ( !colors ) {
    var colors = [ "color" ]
  }
  else if ( !(colors instanceof Array) ) {
    colors = [ colors ]
  }

  function comparator( a , b ) {

    var retVal = 0

    for ( var i = 0 ; i < keys.length ; i++ ) {

      var k = keys[i]

      a = !(k in a) && vars ? d3plus.variable.value(vars,a,k) : a[k]
      b = !(k in b) && vars ? d3plus.variable.value(vars,b,k) : b[k]

      a = a instanceof Array ? a = a[0]
        : typeof a === "string" ? a = a.toLowerCase() : a
      b = b instanceof Array ? b = b[0]
        : typeof b === "string" ? b = b.toLowerCase() : b

      retVal = colors.indexOf(k) >= 0 ? d3plus.color.sort( a , b )
             : a < b ? -1 : 1

      if ( retVal !== 0 || i === keys.length-1 ) {
        break
      }

    }

    return sort === "asc" ? retVal : -retVal

  }

  if ( arr.length === 2 ) {
    return comparator(arr[0],arr[1])
  }

  return arr.sort(comparator)


}
