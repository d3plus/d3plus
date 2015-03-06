defaultLocale = require "../core/locale/languages/en_US.coffee"

# Formats numbers to look "pretty"
module.exports = (number, opts) ->

  if "locale" of this
    time = this.locale.value.time
  else
    time = defaultLocale.time

  opts   = {} unless opts
  vars   = opts.vars or {}
  key    = opts.key
  labels = if "labels" of opts then opts.labels else true

  time.push vars.time.value if vars.time and vars.time.value

  if typeof key is "string" and time.indexOf(key.toLowerCase()) >= 0
    ret = number
  else if key is "share"
    ret = if number is 100 then number else d3.format(".2g") number
  else if number < 10 and number > -10
    ret = d3.round number, 2
  else if number.toString().split(".")[0].length > 3
    symbol = d3.formatPrefix(number).symbol
    symbol = symbol.replace("G", "B") # d3 uses G for giga

    # Format number to precision level using proper scale
    number = d3.formatPrefix(number).scale(number)
    number = parseFloat d3.format(".3g")(number)
    ret = number + symbol
  else
    ret = d3.format(",f") number

  if labels and key and "format" of vars and key of vars.format.affixes.value
    affixes = vars.format.affixes.value[key]
    affixes[0] + ret + affixes[1]
  else
    ret
