fontTester = require "../core/font/tester.coffee"

module.exports = (words, style, opts) ->

  opts   = {} unless opts
  tester = opts.parent or fontTester("svg").append("text")
  style  = style or {}
  sizes  = []
  words  = [ words ] unless words instanceof Array
  tspans = tester.selectAll("tspan").data(words)
  attr   =
    left: "0px"
    position: "absolute"
    top: "0px"
    x: 0
    y: 0

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

getWidth = (elem) ->
  elem.getComputedTextLength()
getHeight = (elem) ->
  elem.offsetHeight or
  elem.getBoundingClientRect().height or
  elem.parentNode.getBBox().height
