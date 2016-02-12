fontTester = require "../core/font/tester.coffee"

module.exports = (words, style, opts) ->

  opts   = {} unless opts
  style  = style or {}
  tester = opts.parent or fontTester("svg").append("text")
  sizes  = []
  words  = [ words ] unless words instanceof Array
  tspans = tester.selectAll("tspan").data(words)

  attr   =
    left: "0px"
    position: "absolute"
    top: "0px"
    x: 0
    y: 0

  spacing = 0
  if "letter-spacing" of style
    spacing = parseFloat(style["letter-spacing"])
    delete style["letter-spacing"]

  getWidth = (elem) ->
    add = 0
    if spacing
      add = (d3.select(elem).text().length - 1) * spacing
    elem.getComputedTextLength() + add

  getHeight = (elem) ->
    elem.offsetHeight or
    elem.parentNode.getBBox().height or
    elem.getBoundingClientRect().height

  tspans.enter().append("tspan")
    .text String
    .style style
    .attr attr
    .each (d) -> opts.mod this if typeof opts.mod is "function"
    .each (d) ->

      children = d3.select(this).selectAll("tspan")
      if children.size()
        width  = []
        children.each -> width.push getWidth(this)
        width = d3.max width
      else
        width = getWidth(this)
      height = getHeight(this)

      sizes.push
        height: height
        text:   d
        width:  width

  tspans.remove()
  tester.remove() unless opts.parent
  sizes
