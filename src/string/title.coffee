###*
 * Formats numbers to look "pretty"
 ###
d3plus.string.title = (text, key, vars) ->

  return "" unless text

  if "locale" of this
    locale = @locale.value
    locale = (if locale of d3plus.locale then d3plus.locale[locale] else d3plus.locale.en_US) if typeof locale is "string"
  else
    locale = d3plus.locale.en_US

  # If it's a sentence, just capitalize the first letter.
  return text.charAt(0).toUpperCase() + text.substr(1)  if text.charAt(text.length - 1) is "."

  smalls = locale.lowercase
  bigs   = locale.uppercase

  text.replace /\S*/g, (txt, i) ->
    if bigs.indexOf(txt.toLowerCase()) >= 0
      return txt.toUpperCase()
    else return txt.toLowerCase() if smalls.indexOf(txt.toLowerCase()) >= 0 and i isnt 0 and i isnt text.length - 1
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
