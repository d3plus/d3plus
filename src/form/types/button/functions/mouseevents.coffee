module.exports = (elem, vars, color) ->

  color  = require "./color.coffee"
  events = require "../../../../client/pointer.coffee"
  ie     = require "../../../../client/ie.js"

  elem
    .on events.over, (d, i) ->

      vars.self.hover d[vars.id.value]

      if ie or !vars.draw.timing
        d3.select(this).style("cursor", "pointer")
          .call color, vars
      else
        d3.select(this).style("cursor", "pointer")
          .transition().duration(vars.timing.mouseevents)
          .call color, vars

    .on events.out, (d) ->

      vars.self.hover false

      if ie or !vars.draw.timing
        d3.select(this).style("cursor", "auto")
          .call color, vars
      else
        d3.select(this).style("cursor", "auto")
          .transition().duration(vars.timing.mouseevents)
          .call color, vars

    .on events.click, (d) ->

      if vars.focus.value isnt false
        vars.self.focus(d[vars.id.value]).draw()
      else if vars.focus.callback
        vars.focus.callback d, vars.self
