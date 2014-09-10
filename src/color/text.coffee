# Returns appropriate text color based off of a given color
module.exports = (color) ->
  rgbColor = d3.rgb(color)
  r = rgbColor.r
  g = rgbColor.g
  b = rgbColor.b
  yiq = (r * 299 + g * 587 + b * 114) / 1000
  if yiq >= 128 then "#444444" else "#f7f7f7"
