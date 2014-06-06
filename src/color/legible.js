//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Darkens a color if it's too light to appear on white
//------------------------------------------------------------------------------
d3plus.color.legible = function(color) {

  var hsl = d3.hsl(color)
  if ( hsl.l > .6 ) {
    if ( hsl.s > .8 ) hsl.s = .8
    hsl.l = 0.6
  }
  return hsl.toString()

}
