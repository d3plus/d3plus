fontTester = require "../core/font/tester.coffee"

module.exports = (words, style, opts) ->

  opts   = {} unless opts
  tester = opts.parent or fontTester("svg").append("text")
  style  = style or {}
  sizes  = []
  words  = [ words ] unless words instanceof Array
  tspans = tester.selectAll("tspan").data(words)
  attr   =
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
      opts.mod this if typeof opts.mod is "function"
      children = d3.select(this).selectAll("tspan")
      if children.size()
        width = []
        children.each ->
          width.push @getComputedTextLength()
        width = d3.max width
      else
        width = @getComputedTextLength()
      height = @offsetHeight or
               @getBoundingClientRect().height or
               @.parentNode.getBBox().height
      sizes.push
        height: height
        text:   d
        width:  width

  tspans.remove()
  tester.remove() unless opts.parent
  sizes
