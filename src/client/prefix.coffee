# Calculates the correct CSS vendor prefix based on the current browser.
prefix = ->

  if "-webkit-transform" of document.body.style
    val = "-webkit-"
  else if "-moz-transform" of document.body.style
    val = "-moz-"
  else if "-ms-transform" of document.body.style
    val = "-ms-"
  else if "-o-transform" of document.body.style
    val = "-o-"
  else
    val = ""

  prefix = -> val

  val

module.exports = prefix
