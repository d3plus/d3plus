//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Lightens a color
//------------------------------------------------------------------------------
d3plus.color.lighter = function( color , increment ) {

  if ( increment === undefined ) {
    var increment = 0.5
  }

  var c = d3.hsl(color)

  c.l += ( 1 - c.l ) * increment

  return c.toString()

}
