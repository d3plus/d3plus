###*
 * Calculates the correct CSS vendor prefix based on the current browser.
 ###
d3plus.prefix = ->

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

  d3plus.prefix = ->
    val

  val
