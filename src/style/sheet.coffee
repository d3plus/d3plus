#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Checks to see if a stylesheet is loaded
#------------------------------------------------------------------------------
d3plus.style.sheet = (name) ->
  i = 0
  returnBoolean = false
  while i < document.styleSheets.length
    sheet = document.styleSheets[i]
    if sheet.href and sheet.href.indexOf(name) >= 0
      returnBoolean = true
      break
    i++
  returnBoolean

module.exports = d3plus.style.sheet
