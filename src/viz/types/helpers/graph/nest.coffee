fetchValue   = require "../../../../core/fetch/value.coffee"
stringStrip  = require "../../../../string/strip.js"
uniqueValues = require "../../../../util/uniques.coffee"

module.exports = (vars, data, keys) ->

  if keys is undefined
    keys = vars.id.nesting.slice(0, vars.depth.value+1)
  else if keys.constructor isnt Array
    keys = [keys]

  extras   = [] if extras is undefined
  data     = vars.data.viz unless data
  discrete = vars[vars.axes.discrete]
  opposite = vars[vars.axes.opposite]
  timeAxis = discrete.value is vars.time.value
  if timeAxis
    ticks = vars.data.time.ticks
    key = if vars.time.solo.value.length then "solo" else "mute"
    if vars.time[key].value.length
      serialized = vars.time[key].value.slice().map (f) ->
        if f.constructor isnt Date
          f = f + ""
          f += "/01/01" if f.length is 4 and parseInt(f)+"" is f
          f = new Date f
        +f
      ticks = ticks.filter (f) ->
        if key is "solo"
          serialized.indexOf(+f) >= 0
        else
          serialized.indexOf(+f) < 0
  else if discrete.ticks.values
    ticks = discrete.ticks.values
  else
    ticks = uniqueValues data, discrete.value, fetchValue, vars

  d3.nest()
    .key (d) ->
      return_id = "nesting"
      for id in keys
        val = fetchValue vars, d, id
        val = val.join("_") if val instanceof Array
        return_id += "_" + stringStrip val
      return_id
    .rollup (leaves) ->

      availables = uniqueValues leaves, discrete.value, fetchValue, vars
      timeVar    = availables.length and availables[0].constructor is Date
      availables = availables.map(Number) if timeVar

      if discrete.zerofill.value

        if discrete.scale.value is "log"
          if opposite.scale.viz.domain().every((d) -> d < 0)
            filler = -1
          else
            filler = 1
        else
          filler = 0

        for tick, i in ticks

          tester = if timeAxis then +tick else tick

          if availables.indexOf(tester) < 0

            obj                 = {d3plus: {}}
            for key in vars.id.nesting
              obj[key] = leaves[0][key] if key of leaves[0]
            obj[discrete.value] = tick
            obj[opposite.value] = 0
            obj[opposite.value] = filler

            leaves.splice i, 0, obj

      if typeof leaves[0][discrete.value] is "string"
        leaves
      else
        leaves.sort (a, b) ->
          ad = fetchValue vars, a, discrete.value
          bd = fetchValue vars, b, discrete.value
          xsort = ad - bd
          return xsort if xsort
          ao = fetchValue vars, a, opposite.value
          bo = fetchValue vars, b, opposite.value
          ao - bo

    .entries data
