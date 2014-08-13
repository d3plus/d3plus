fontTester = require "../core/font/tester.coffee"

###*
 * Creates test div to populate with test DIVs
 ###
d3plus.font.sizes = (words, style, parent) ->

  tester = parent or fontTester("svg").append("text")
  style = style or {}
  sizes = []
  words = [ words ] unless words instanceof Array
  tspans = tester.selectAll("tspan.d3plus_testFontSize").data(words)
  attr =
    x: 0
    y: 0

  tspans.enter().append("tspan").attr("class", "d3plus_testFontSize").text(String).style(style).attr(attr).each (d) ->
    sizes.push
      height: @offsetHeight or @getBoundingClientRect().height
      text: d
      width: @getComputedTextLength()

  tspans.remove()
  tester.remove() unless tester
  sizes
