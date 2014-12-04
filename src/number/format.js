var defaultLocale = require("../core/locale/languages/en_US.coffee");

// Formats numbers to look "pretty"
module.exports = function(number, key, vars, data) {

  if ( "locale" in this ) {
    var time = this.locale.value.time
  }
  else {
    var time = defaultLocale.time
  }

  if ( vars && vars.time && typeof vars.time.value === "string") {
    time.push(vars.time.value)
  }

  if (typeof key === "string" && time.indexOf(key.toLowerCase()) >= 0) {
    return number
  }
  else if (number < 10 && number > -10) {
    return d3.round(number,2)
  }
  else if (number.toString().split(".")[0].length > 3) {
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
