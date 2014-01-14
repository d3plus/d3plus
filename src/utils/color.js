//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator
//------------------------------------------------------------------------------
d3plus.color.scale = d3.scale.category20b()
d3plus.color.random = function(x) {
  var rand_int = x || Math.floor(Math.random()*20)
  return d3plus.color.scale(rand_int);
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns appropriate text color based off of a given color
//------------------------------------------------------------------------------
d3plus.color.text = function(color) {
  var hsl = d3.hsl(color),
      light = "#ffffff", 
      dark = "#333333";
  if (hsl.l > 0.65) return dark;
  else if (hsl.l < 0.49) return light;
  return hsl.h > 35 && hsl.s >= 0.3 ? dark : light;
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Darkens a color if it's too light to appear on white
//------------------------------------------------------------------------------
d3plus.color.legible = function(color) {
  var hsl = d3.hsl(color)
  if (hsl.s > .9) hsl.s = .9
  if (hsl.l > .4) hsl.l = .4
  return hsl.toString();
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Darkens a color
//------------------------------------------------------------------------------
d3plus.color.darker = function(color) {
  var c = d3.hsl(color)
  c.l = c.l < .2 ? 0 : c.l-.2;
  return c.toString();
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Lightens a color
//------------------------------------------------------------------------------
d3plus.color.lighter = function(color) {
  var c = d3.hsl(color);
  c.l = 0.95;
  return c.toString();
}