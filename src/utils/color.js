//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator
//------------------------------------------------------------------------------
d3plus.color.scale = {}
d3plus.color.scale.default = d3.scale.ordinal().range([
  "#b35c1e",
  "#C9853A",
  "#E4BA79",
  "#F5DD9E",
  "#F3D261",
  "#C4B346",
  "#94B153",
  "#254322",
  "#4F6456",
  "#759E80",
  "#9ED3E3",
  "#27366C",
  "#7B91D3",
  "#C6CBF7",
  "#D59DC2",
  "#E5B3BB",
  "#E06363",
  "#AF3500",
  "#D74B03",
  "#843012",
  "#9A4400",
])

d3plus.color.random = function(x) {
  var rand_int = x || Math.floor(Math.random()*20)
  return d3plus.color.scale.default(rand_int)
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
      light = "#f7f7f7",
      dark = "#444444";
  if (hsl.l > 0.65) return dark;
  else if (hsl.l < 0.49) return light;
  return hsl.h > 35 && hsl.s >= 0.3 ? dark : light;
}
