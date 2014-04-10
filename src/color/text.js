//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns appropriate text color based off of a given color
//------------------------------------------------------------------------------
d3plus.color.text = function(color) {

  var hsl = d3.hsl(color)
    , light = "#f7f7f7"
    , dark = "#444444"

  return hsl.l > 0.65 ? dark
       : hsl.l < 0.49 ? light
       : hsl.h > 35 && hsl.s >= 0.3 ? dark
       : light

}
