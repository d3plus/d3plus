var fetchValue = require("../core/fetch/value.js"),
    fetchColor = require("../core/fetch/color.js"),
    fetchText  = require("../core/fetch/text.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sorts an array of objects
//------------------------------------------------------------------------------
d3plus.array.sort = function( arr , keys , sort , colors , vars , depth ) {

  if ( !arr || arr.length <= 1 || !keys ) {
    return arr || []
  }

  if ( !sort ) {
    var sort = "asc"
  }

  if ( !(keys instanceof Array) ) {
    keys = [ keys ]
  }

  if ( !(colors instanceof Array) ) {
    colors = [ colors ]
  }

  if (depth !== undefined && typeof depth !== "number") {
    depth = vars.id.nesting.indexOf(depth)
  }

  function comparator( a , b ) {

    var retVal = 0

    for ( var i = 0 ; i < keys.length ; i++ ) {

      var k = keys[i]

      if ( vars ) {

        a = k === vars.text.value
          ? fetchText( vars , a , depth )
          : fetchValue( vars , a , k , depth )

        b = k === vars.text.value
          ? fetchText( vars , b , depth )
          : fetchValue( vars , b , k , depth )

      }
      else {
        a = a[k]
        b = b[k]
      }

      if (colors.indexOf(k) >= 0) {
        a = fetchColor(vars, a, depth)
        b = fetchColor(vars, b, depth)
        retVal = d3plus.color.sort(a,b)
      }
      else {
        a = a instanceof Array ? a = a[0]
          : typeof a === "string" ? a = a.toLowerCase() : a
        b = b instanceof Array ? b = b[0]
          : typeof b === "string" ? b = b.toLowerCase() : b
        retVal = a < b ? -1 : 1
      }

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
