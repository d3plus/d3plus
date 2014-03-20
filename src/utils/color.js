//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator
//------------------------------------------------------------------------------
// d3plus.color.scale = d3.scale.category20()
d3plus.color.scale = d3.scale.ordinal().range([
  "#B22937", "#E0E61A", "#20B2AA", "#434187", "#A660AC",
  "#E27A1D", "#4CA82B", "#7F91C3", "#502E72", "#A63570",
  "#C11C17", "#ACD62A", "#60B6CA", "#1F1D6D", "#A650A0",
  "#E6AA19", "#228B22", "#6F6DA7", "#80529A", "#A2395B",
  "#DE5003", "#80C837", "#93BDE7", "#3B256D", "#A6358C",
  "#EFCE10", "#229F6E", "#575597", "#A670B8", "#888888",
  "#DEA1A7", "#F0F29A", "#9CDEDA", "#ABADCB", "#D6B8D8",
  "#F2C69D", "#B0D8A3", "#C7CDE3", "#B4A2C2", "#D6A5C0",
  "#E19C9B", "#D8EAA2", "#B8DEE6", "#9F9DBD", "#D6B4D4",
  "#F2DA99", "#9ECB9E", "#BFBDD7", "#C8B2D2", "#D6A9B7",
  "#EEB493", "#C8E4A7", "#CFE1F3", "#ABA1BD", "#D6A5CC",
  "#F7EA98", "#9ED3BE", "#B7B5CF", "#D6C0E0", "#cccccc"
])
d3plus.color.random = function(x) {
  var rand_int = x || Math.floor(Math.random()*20)
  return d3plus.color.scale(rand_int)
}

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

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Mixes 2 hexidecimal colors
//------------------------------------------------------------------------------
d3plus.color.mix = function(c1,c2,o1,o2) {

  if (!o1) var o1 = 1
  if (!o2) var o2 = 1

  c1 = d3.rgb(c1)
  c2 = d3.rgb(c2)

  var r = (o1*c1.r + o2*c2.r - o1*o2*c2.r)/(o1+o2-o1*o2),
      g = (o1*c1.g + o2*c2.g - o1*o2*c2.g)/(o1+o2-o1*o2),
      b = (o1*c1.b + o2*c2.b - o1*o2*c2.b)/(o1+o2-o1*o2)

  return d3.rgb(r,g,b).toString()

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns appropriate text color based off of a given color
//------------------------------------------------------------------------------
d3plus.color.text = function(color) {
  var hsl = d3.hsl(color),
      light = "#ffffff",
      dark = "#444444";
  if (hsl.l > 0.65) return dark;
  else if (hsl.l < 0.49) return light;
  return hsl.h > 35 && hsl.s >= 0.3 ? dark : light;
}
