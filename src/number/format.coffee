defaultLocale = require "../core/locale/languages/en_US.coffee"

# Formats numbers to look "pretty"
module.exports = (number, key, vars, data) ->

  if "locale" of this
    time = this.locale.value.time
  else
    time = defaultLocale.time

  if vars and vars.time and typeof vars.time.value is "string"
    time.push vars.time.value

  if typeof key is "string" and time.indexOf(key.toLowerCase()) >= 0
    number
  else if key is "share"
    return number if number is 100
    d3.format(".2g") number
  else if number < 10 and number > -10
    d3.round number, 2
  else if number.toString().split(".")[0].length > 3
    symbol = d3.formatPrefix(number).symbol
    symbol = symbol.replace("G", "B") # d3 uses G for giga

    # Format number to precision level using proper scale
    number = d3.formatPrefix(number).scale(number)
    number = parseFloat d3.format(".3g")(number)
    number + symbol
  else
    d3.format(",f") number
