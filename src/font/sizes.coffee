fontTester = require "../core/font/tester.coffee"

module.exports = (words, style, parent) ->

  tester = parent or fontTester("svg").append("text")
  style = style or {}
  sizes = []
  words = [ words ] unless words instanceof Array
  tspans = tester.selectAll("tspan").data(words)
  attr =
    x: 0
    y: 0

  tspans.enter().append("tspan")
    .text String
    .attr "position", "absolute"
    .attr "top", "0px"
    .attr "left", "0px"
    .style style
    .attr attr
    .each (d) ->
      sizes.push
        height: @offsetHeight or @getBoundingClientRect().height or @.parentNode.getBBox().height
        text: d
        width: @getComputedTextLength()

  tspans.remove()
  tester.remove() unless parent
  sizes
