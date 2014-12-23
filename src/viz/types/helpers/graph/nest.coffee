fetchValue   = require "../../../../core/fetch/value.coffee"
stringStrip  = require "../../../../string/strip.js"
uniqueValues = require "../../../../util/uniques.coffee"

module.exports = (vars, data) ->

  data     = vars.data.viz unless data
  discrete = vars[vars.axes.discrete]
  opposite = vars[vars.axes.opposite]
  ticks    = if discrete.value is vars.time.value then vars.data.time.values else discrete.ticks.values
  offsets  =
    x: vars.axes.margin.left
    y: vars.axes.margin.top

  d3.nest()
    .key (d) ->
      id = fetchValue vars, d, vars.id.value
      depth = if "depth" of d.d3plus then d.d3plus.depth else vars.depth.value
      "nested_"+stringStrip(id)+"_"+depth
    .rollup (leaves) ->

      availables = uniqueValues leaves, discrete.value, fetchValue, vars
      timeVar    = availables[0].constructor is Date
      availables = availables.map((t) -> t.getTime()) if timeVar

      for tick, i in ticks

        tester = if tick.constructor is Date then tick.getTime() else tick

        if availables.indexOf(tester) < 0 and discrete.zerofill.value

          obj                 = {d3plus: {}}
          obj[vars.id.value]  = leaves[0][vars.id.value]
          obj[discrete.value] = tick
          obj[opposite.value] = opposite.scale.viz.domain()[1]

          leaves.push obj

      if typeof leaves[0][discrete.value] is "string"
        leaves
      else
        leaves.sort (a, b) ->
          xsort = a[discrete.value] - b[discrete.value]
          ysort = a[opposite.value] - b[opposite.value]
          if xsort then xsort else ysort

    .entries data
