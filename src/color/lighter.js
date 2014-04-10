//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Lightens a color
//------------------------------------------------------------------------------
d3plus.color.lighter = function(color,increment) {
  var c = d3.hsl(color);

  if (!increment) {
    var increment = 0.1
  }

  c.l += increment
  c.s -= increment/2
  if (c.l > .95) {
    c.l = .95
  }
  if (c.s < .05) {
    c.s = .05
  }

  return c.toString();
}
