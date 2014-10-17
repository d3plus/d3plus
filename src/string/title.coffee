defaultLocale = require "../core/locale/languages/en_US.coffee"

module.exports = (text, key, vars, data) ->

  return "" unless text

  locale = if "locale" of this then @locale.value else defaultLocale

  # If it's a sentence, just capitalize the first letter.
  return text.charAt(0).toUpperCase() + text.substr(1)  if text.charAt(text.length - 1) is "."

  smalls = locale.lowercase
  bigs   = locale.uppercase

  text.replace /\S*/g, (txt, i) ->
    if bigs.indexOf(txt.toLowerCase()) >= 0
      return txt.toUpperCase()
    else return txt.toLowerCase() if smalls.indexOf(txt.toLowerCase()) >= 0 and i isnt 0 and i isnt text.length - 1
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
