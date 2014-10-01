fetchValue = require "../../core/fetch/value.js"
graph      = require "./helpers/graph/draw.coffee"
uniques    = require "../../util/uniques.coffee"

box = (vars) ->

  graph vars,
    buffer: true
    mouse:  true

  discrete  = vars.axes.discrete
  opposite  = vars.axes.opposite
  disMargin = if discrete is "x" then vars.axes.margin.left else vars.axes.margin.top
  oppMargin = if opposite is "x" then vars.axes.margin.left else vars.axes.margin.top
  h         = if discrete is "x" then "height" else "width"
  w         = if discrete is "x" then "width" else "height"
  space     = vars.axes[w] / vars[discrete].ticks.values.length
  space     = d3.max [d3.min([space/2,40]), 10]
  mode      = vars.type.mode.value

  if !(mode instanceof Array)
    mode = [mode, mode]

  mergeData = (arr) ->
    obj = {}
    for key of vars.data.keys
      vals = uniques arr, key
      obj[key] = if vals.length is 1 then vals[0] else vals
    obj

  returnData = []
  d3.nest()
    .key (d) -> fetchValue(vars, d, vars[discrete].value)
    .rollup (leaves) ->

      scale  = vars[opposite].scale.viz
      values = leaves.map (d) -> fetchValue(vars, d, vars[opposite].value)
      values.sort (a, b) -> a - b

      first  = d3.quantile values, 0.25
      median = d3.quantile values, 0.50
      second = d3.quantile values, 0.75

      if mode[0] is "tukey"
        iqr    = first - second
        bottom = first + iqr * 1.5
      else if mode[0] is "extent"
        bottom = d3.min values
      else if typeof mode[0] is "number"
        bottom = d3.quantile values, mode[0]/100

      if mode[1] is "tukey"
        iqr = first - second
        top = second - iqr * 1.5
      else if mode[1] is "extent"
        top = d3.max values
      else if typeof mode[1] is "number"
        top = d3.quantile values, (100 - mode[1])/100

      bottom = d3.max [d3.min(values), bottom]
      top    = d3.min [d3.max(values), top]

      boxData       = []
      bottomWhisker = []
      topWhisker    = []
      outliers      = []
      for d in leaves
        val = fetchValue(vars, d, vars[opposite].value)
        if val >= first and val <= second
          boxData.push d
        else if val >= bottom and val < first
          bottomWhisker.push d
        else if val <= top and val > second
          topWhisker.push d
        else outliers.push d

      key  = fetchValue(vars, leaves[0], vars[discrete].value)
      x    = vars[discrete].scale.viz key
      x   += disMargin

      label = vars.format.value(key, vars[discrete].value, vars)
      key = key.getTime() if key.constructor is Date

      # Create center box
      boxData = mergeData boxData

      boxData.d3plus =
          color:  "white"
          id:     "box_"+key
          init:   {}
          label:  false
          shape:  "square"
          stroke: "#444"
          text:   "Interquartile Range for " + label

      boxData.d3plus[w]      = space
      boxData.d3plus.init[w] = space
      boxData.d3plus[h]      = Math.abs scale(first) - scale(second)

      boxData.d3plus[discrete] = x
      y = d3.min([scale(first),scale(second)]) + boxData.d3plus[h]/2
      y += oppMargin
      boxData.d3plus[opposite] = y

      returnData.push boxData

      medianData =
        d3plus:
          id:       "median_line_"+key
          position: if h is "height" then "top" else "right"
          shape:    "whisker"
          static:   true
          text:     median

      medianData.d3plus[w]        = space
      medianData.d3plus[discrete] = x
      medianData.d3plus[opposite] = scale(median) + oppMargin

      returnData.push medianData

      # Create whiskers
      bottomWhisker = mergeData bottomWhisker
      bottomWhisker.d3plus =
        id:       "bottom_whisker_line_"+key
        offset:   boxData.d3plus[h]/2
        position: if h is "height" then "bottom" else "left"
        shape:    "whisker"
        static:   true

      bottomWhisker.d3plus.offset   *= -1 if opposite is "x"
      bottomWhisker.d3plus[h]        = Math.abs scale(bottom) - scale(first)
      bottomWhisker.d3plus[w]        = space
      bottomWhisker.d3plus[discrete] = x
      bottomWhisker.d3plus[opposite] = y
      returnData.push bottomWhisker

      topWhisker = mergeData topWhisker
      topWhisker.d3plus =
        id:       "top_whisker_line_"+key
        offset:   boxData.d3plus[h]/2
        position: if h is "height" then "top" else "right"
        shape:    "whisker"
        static:   true

      topWhisker.d3plus.offset   *= -1 if opposite is "y"
      topWhisker.d3plus[h]        = Math.abs scale(top) - scale(second)
      topWhisker.d3plus[w]        = space
      topWhisker.d3plus[discrete] = x
      topWhisker.d3plus[opposite] = y
      returnData.push topWhisker

      for d in outliers
        d.d3plus[discrete]  = x
        d.d3plus[opposite]  = scale fetchValue(vars, d, vars.y.value)
        d.d3plus[opposite] += oppMargin
        d.d3plus.r = 4
        d.d3plus.shape = vars.shape.value

      returnData = returnData.concat(outliers)

      return leaves
    .entries vars.data.viz

  returnData

# Visualization Settings and Helper Functions
box.modes        = ["tukey", "extent", Array, Number]
box.requirements = ["data", "x", "y"]
box.shapes       = ["circle", "check", "cross", "diamond", "square", "triangle", "triangle_up", "triangle_down"]
box.setup        = (vars) ->
  unless vars.axes.discrete
    if vars.y.value is vars.time.value
      vars.self.y scale: "discrete"
    else
      vars.self.x scale: "discrete"

module.exports = box
