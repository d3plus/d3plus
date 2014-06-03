//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sorts colors based on hue
//------------------------------------------------------------------------------
d3plus.color.sort = function( a , b ) {

  var aHSL = d3.hsl(a)
  var bHSL = d3.hsl(b)

  a = aHSL.s === 0 ? 361 : aHSL.h
  b = bHSL.s === 0 ? 361 : bHSL.h

  return a === b ? aHSL.l - bHSL.l : a - b

}
