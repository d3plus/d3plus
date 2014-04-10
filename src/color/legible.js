//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Darkens a color if it's too light to appear on white
//------------------------------------------------------------------------------
d3plus.color.legible = function(color) {
  var hsl = d3.hsl(color)
  if (hsl.s > .9) hsl.s = .9
  if (hsl.l > .4) hsl.l = .4
  return hsl.toString();
}
