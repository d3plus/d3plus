//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Darkens a color
//------------------------------------------------------------------------------
d3plus.color.darker = function(color,increment) {
  var c = d3.hsl(color);

  if (!increment) {
    var increment = 0.2
  }

  c.l -= increment
  if (c.l < 0.1) {
    c.l = 0.1
  }

  return c.toString();
}
