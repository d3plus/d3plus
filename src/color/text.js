//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns appropriate text color based off of a given color
//------------------------------------------------------------------------------
d3plus.color.text = function(color) {

  var rgbColor = d3.rgb(color)
    , r = rgbColor.r
    , g = rgbColor.g
    , b = rgbColor.b
    , yiq = (r * 299 + g * 587 + b * 114) / 1000

  return yiq >= 128 ? "#444444" : "#f7f7f7"

}
