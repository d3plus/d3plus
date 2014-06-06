//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sorts colors based on hue
//------------------------------------------------------------------------------
d3plus.color.validate = function( color ) {

  color = color.replace(/ /g,'')

  if ( color.indexOf("rgb") === 0 ) {
    color = color.split("(")[1].split(")")[0].split(",").slice(0,3).join(",")
  }
  if ( color.indexOf("hsl") === 0 ) {
    color = color.split(",")[2].split(")")[0]
  }

  var testColor   = d3.rgb(color).toString()
    , blackColors = [ "black" , "#000" , "#000000", "0%" , "0,0,0" ]
    , userBlack   = blackColors.indexOf(color) >= 0

  return testColor !== "#000000" || userBlack

}
