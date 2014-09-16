# Checks to see if a stylesheet is loaded
sheet = (name) ->

  tested = sheet.tested
  return tested[name] if name of tested
  i = 0
  returnBoolean = false

  while i < document.styleSheets.length
    css = document.styleSheets[i]
    if css.href and css.href.indexOf(name) >= 0
      returnBoolean = true
      break
    i++
  returnBoolean

sheet.tested = {}

module.exports = sheet
