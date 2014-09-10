# Tests if a string is a valid color
module.exports = (color) ->
  color = color + ""
  color = color.replace(RegExp(" ", "g"), "")
  color = color.split("(")[1].split(")")[0].split(",").slice(0, 3).join(",") if color.indexOf("rgb") is 0
  color = color.split(",")[2].split(")")[0]  if color.indexOf("hsl") is 0
  testColor = d3.rgb(color).toString()
  blackColors = [ "black", "#000", "#000000", "0%", "0,0,0" ]
  userBlack = blackColors.indexOf(color) >= 0
  testColor isnt "#000000" or userBlack
