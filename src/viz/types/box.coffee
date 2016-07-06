fetchValue = require "../../core/fetch/value.coffee"
graph      = require "./helpers/graph/draw.coffee"
stringFormat = require "../../string/format.js"
strip      = require "../../string/strip.js"
uniques    = require "../../util/uniques.coffee"

box = (vars) ->

  graph vars,
    buffer: true

  domains = vars.x.domain.viz.concat vars.y.domain.viz
  return [] if domains.indexOf(undefined) >= 0

  discrete  = vars.axes.discrete
  opposite  = vars.axes.opposite
  disMargin = if discrete is "x" then vars.axes.margin.viz.left else vars.axes.margin.viz.top
  oppMargin = if opposite is "x" then vars.axes.margin.viz.left else vars.axes.margin.viz.top
  h         = if discrete is "x" then "height" else "width"
  w         = if discrete is "x" then "width" else "height"
  space     = vars.axes[w] / vars[discrete].ticks.values.length
  size      = vars.size.value
  size      = if typeof size is "number" then size else 100
  space     = d3.min [space - vars.labels.padding * 2, size]
  mode      = vars.type.mode.value

  if !(mode instanceof Array)
    mode = [mode, mode]

  mergeData = (arr) ->
    obj = {}
    for key of vars.data.keys
      vals = uniques arr, key, fetchValue, vars
      obj[key] = if vals.length is 1 then vals[0] else vals
    obj

  noData  = false
  medians = []


  iqrstr = vars.format.value(vars.format.locale.value.ui.iqr)
  maxstr = vars.format.value(vars.format.locale.value.ui.max)
  minstr = vars.format.value(vars.format.locale.value.ui.min)
  pctstr = vars.format.value(vars.format.locale.value.ui.percentile)
  botstr = vars.format.value(vars.format.locale.value.ui.tukey_bottom)
  topstr = vars.format.value(vars.format.locale.value.ui.tukey_top)
  qt1str = vars.format.value(vars.format.locale.value.ui.quartile_first)
  qt3str = vars.format.value(vars.format.locale.value.ui.quartile_third)
  medstr = vars.format.value(vars.format.locale.value.ui.median)

  returnData = []
  d3.nest()
    .key (d) -> fetchValue(vars, d, vars[discrete].value)
    .rollup (leaves) ->

      scale  = vars[opposite].scale.viz
      values = leaves.map (d) -> fetchValue(vars, d, vars[opposite].value)
      values.sort (a, b) -> a - b
      uniqs = uniques values

      first  = d3.quantile values, 0.25
      median = d3.quantile values, 0.50
      second = d3.quantile values, 0.75

      tooltipData = {}

      if mode[1] is "tukey"
        iqr = first - second
        top = second - iqr * 1.5
        topLabel = topstr
      else if mode[1] is "extent"
        top = d3.max values
        topLabel = maxstr
      else if typeof mode[1] is "number"
        top = d3.quantile values, (100 - mode[1])/100
        topLabel = stringFormat pctstr, mode[1]
      top = d3.min [d3.max(values), top]

      if vars.tooltip.extent.value
        tooltipData[topLabel] =
          key:   vars[opposite].value
          value: top

      if vars.tooltip.iqr.value
        tooltipData[qt3str] =
            key:   vars[opposite].value
            value: second
        tooltipData[medstr] =
            key:   vars[opposite].value
            value: median
        tooltipData[qt1str] =
            key:   vars[opposite].value
            value: first

      if mode[0] is "tukey"
        iqr    = first - second
        bottom = first + iqr * 1.5
        bottomLabel = botstr
      else if mode[0] is "extent"
        bottom = d3.min values
        bottomLabel = minstr
      else if typeof mode[0] is "number"
        bottom = d3.quantile values, mode[0]/100
        topLabel = stringFormat pctstr, mode[0]
      bottom = d3.max [d3.min(values), bottom]

      if vars.tooltip.extent.value
        tooltipData[bottomLabel] =
          key:   vars[opposite].value
          value: bottom

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

      label = vars.format.value(key, {key: vars[discrete].value, vars: vars})
      key = key.getTime() if key.constructor is Date
      key = strip key

      # Create center box
      boxData = mergeData boxData

      boxData.d3plus =
          color:  "white"
          id:     "box_"+key
          init:   {}
          label:  false
          shape:  "square"
          stroke: "#444"
          text:   stringFormat iqrstr, label

      boxData.d3plus[w]      = space
      boxData.d3plus.init[w] = space
      boxData.d3plus[h]      = Math.abs scale(first) - scale(second)

      boxData.d3plus[discrete] = x
      y = d3.min([scale(first),scale(second)]) + boxData.d3plus[h]/2
      y += oppMargin
      boxData.d3plus[opposite] = y

      boxData.d3plus.tooltip = tooltipData

      returnData.push boxData

      medianData =
        d3plus:
          id:       "median_line_"+key
          position: if h is "height" then "top" else "right"
          shape:    "whisker"
          static:   true

      medianText = vars.format.value median,
        key:  vars[opposite].value
        vars: vars

      label =
        background: "#fff"
        names:      [medianText]
        padding:    0
        resize:     false
        x:          0
        y:          0
      diff1 = Math.abs scale(median) - scale(first)
      diff2 = Math.abs scale(median) - scale(second)
      medianHeight = d3.min([diff1, diff2]) * 2
      medianBuffer = vars.data.stroke.width * 2 + vars.labels.padding * 2
      label[if w is "width" then "w" else "h"] = space - medianBuffer
      label[if h is "width" then "w" else "h"] = medianHeight - medianBuffer

      medianData.d3plus.label = label

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

      noData = !outliers.length and top - bottom is 0
      medians.push median

      returnData = returnData.concat(outliers)

      return leaves
    .entries vars.data.viz

  if noData and uniques(medians).length is 1 then [] else returnData

# Visualization Settings and Helper Functions
box.modes        = ["tukey", "extent", Array, Number]
box.requirements = ["data", "x", "y"]
box.shapes       = ["circle", "check", "cross", "diamond", "square",
                    "triangle", "triangle_up", "triangle_down"]
box.setup        = (vars) ->
  unless vars.axes.discrete
    axis = if vars.time.value is vars.y.value then "y" else "x"
    vars.self[axis] scale: "discrete"

module.exports = box
