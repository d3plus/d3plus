//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats numbers to look "pretty"
//------------------------------------------------------------------------------
d3plus.number.format = function( number , key , vars ) {

  if ( !vars && "getVars" in this) {
    var vars = this.getVars()
  }

  if ( vars && key && (
       ( key === vars.x.value && vars.x.scale.value === "log" ) ||
       ( key === vars.y.value && vars.y.scale.value === "log" ) ) ) {

    var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹"
      , formatPower = function(d) {
          return (d + "").split("").map(function(c) {
            return superscript[c]
          }).join("")
        }

    return 10 + " " + formatPower( Math.round(Math.log(number) / Math.LN10) )

  }

  if ( "locale" in this ) {
    var locale = this.locale.value
      , time = locale.time
  }
  else {
    var locale = d3plus.locale.en_US
      , time = locale.time
  }

  if ( vars && typeof vars.time.value === "string") {
    time.push(vars.time.value)
  }

  if (typeof key === "string" && time.indexOf(key.toLowerCase()) >= 0) {
    return number
  }
  else if (number < 10 && number > -10) {
    return d3.round(number,2)
  }
  else if (number.toString().split(".")[0].length > 4) {
    var symbol = d3.formatPrefix(number).symbol
    symbol = symbol.replace("G", "B") // d3 uses G for giga

    // Format number to precision level using proper scale
    number = d3.formatPrefix(number).scale(number)
    number = parseFloat(d3.format(".3g")(number))
    return number + symbol;
  }
  else if (key == "share") {
    return d3.format(".2f")(number)
  }
  else {
    return d3.format(",f")(number)
  }

}
