buffer     = require "./buffer.coffee"
closest    = require "../../../../../util/closest.coffee"
fetchData  = require "../../../../../core/fetch/data.js"
fetchValue = require "../../../../../core/fetch/value.js"
print      = require "../../../../../core/console/print.coffee"
uniques    = require "../../../../../util/uniques.coffee"

module.exports = (vars, opts) ->

  changed           = dataChange vars
  vars.axes.dataset = getData vars if changed
  vars.axes.scale   = if opts.buffer then sizeScale vars, opts.buffer else false

  for axis in ["x","y"]

    filtered = vars[axis].solo.changed or vars[axis].mute.changed
    modified = changed or vars[axis].changed or (vars.time.fixed.value and filtered)

    if modified or vars[axis].stacked.changed

      print.time "calculating "+axis+" axis" if vars.dev.value

      # reset ticks
      vars[axis].ticks.values = false

      # calculate range
      zero  = if [true,axis].indexOf(opts.zero) > 0 then true else false
      range = axisRange vars, axis, zero

      # add padding to axis if there is only 1 value
      range = soloPadding vars, axis, range if range[0] is range[1] and !vars[axis].range.value

      # calculate ticks if the axis is the time variable
      if vars[axis].value is vars.time.value
        vars[axis].ticks.values = timeTicks vars, range
      else if axis is vars.axes.continuous
        vars[axis].ticks.values = uniques vars.axes.dataset, (d) ->
          fetchValue vars, d, vars[axis].value

      # flip range if Y axis
      range = range.reverse() if axis is "y"

      # calculate scale
      vars[axis].scale.viz = getScale vars, axis, range

      # Add buffer to scale if it needs it
      buffer vars, axis, opts.buffer if opts.buffer and axis isnt vars.axes.continuous and !vars[axis].range.value

      # store axis domain
      vars[axis].domain.viz = range

      print.timeEnd "calculating "+axis+" axis" if vars.dev.value

  # Mirror axes, if applicable
  if vars.axes.mirror.value
    domains = vars.y.domain.viz.concat(vars.x.domain.viz)
    vars.x.domain.viz = d3.extent(domains)
    vars.y.domain.viz = d3.extent(domains).reverse()

  return

dataChange = (vars) ->

  check   = ["data","time","id","depth","type"]
  changed = vars.time.fixed.value and (vars.time.solo.changed or vars.time.mute.changed)

  for k in check
    if changed or vars[k].changed
      changed = true
      break

  changed

getData = (vars) ->
  if vars.time.fixed.value
    vars.data.viz
  else
    depths  = d3.range(0,vars.id.nesting.length)
    d3.merge [fetchData(vars,"all",d) for d in depths]

axisRange = (vars, axis, zero) ->
  if vars[axis].range.value and vars[axis].range.value.length is 2
    vars[axis].range.value.slice()
  else if vars[axis].scale.value is "share"
    vars[axis].ticks.values = d3.range 0, 1.1, 1.1
    [0,1]
  else if vars[axis].stacked.value
    oppAxis = if axis is "x" then "y" else "x"
    axisSums = d3.nest()
      .key (d) -> fetchValue vars, d, vars[oppAxis].value
      .rollup (leaves) ->
        positives = d3.sum leaves, (d) ->
          val = fetchValue vars, d, vars[axis].value
          if val > 0 then val else 0
        negatives = d3.sum leaves, (d) ->
          val = fetchValue vars, d, vars[axis].value
          if val < 0 then val else 0
        [negatives,positives]
      .entries vars.axes.dataset
    values = d3.merge axisSums.map (d) -> d.values
    d3.extent values
  else
    values = vars.axes.dataset.map (d) -> fetchValue vars, d, vars[axis].value
    values.push 0 if zero
    d3.extent values

timeTicks = (vars, range) ->
  ticks = vars.data.time.ticks.filter (t) ->
    t <= range[1] and t >= range[0]
  minClosest = closest vars.data.time.ticks, range[0]
  maxClosest = closest vars.data.time.ticks, range[1]
  ticks.unshift minClosest if ticks.indexOf(minClosest) < 0
  ticks.push maxClosest if ticks.indexOf(maxClosest) < 0
  ticks

soloPadding = (vars, axis, range) ->

  if vars[axis].value is vars.time.value
    closestTime = closest(vars.data.time.ticks, range[0])
    timeIndex = vars.data.time.ticks.indexOf(closestTime)
    if timeIndex > 0
      range[0] = vars.data.time.ticks[timeIndex - 1]
    else
      diff = vars.data.time.ticks[timeIndex + 1] - closestTime
      range[0] = new Date(closestTime.getTime() - diff)
    if timeIndex < vars.data.time.ticks.length - 1
      range[1] = vars.data.time.ticks[timeIndex + 1]
    else
      diff = closestTime - vars.data.time.ticks[timeIndex - 1]
      range[1] = new Date(closestTime.getTime() + diff)
  else
    range[0] -= 1
    range[1] += 1

  range

getScale = (vars, axis, range) ->
  rangeMax  = if axis is "x" then vars.width.viz else vars.height.viz
  scaleType = vars[axis].scale.value
  scaleType = "linear" if ["continuous","share"].indexOf(scaleType) >= 0
  d3.scale[scaleType]()
    .domain range
    .rangeRound [0,rangeMax]

sizeScale = (vars, value) ->

  value = "size" if value is true
  value = vars[value].value if value of vars

  min = vars.size.scale.min.value
  min = min vars if typeof min is "function"
  max = vars.size.scale.max.value
  max = max vars if typeof max is "function"

  if value is false
    vars.size.scale.value.rangeRound [max,max]
  else if typeof value is "number"
    vars.size.scale.value.rangeRound [value,value]
  else if value

    print.time "calculating buffer scale" if vars.dev.value

    domain = d3.extent vars.axes.dataset, (d) ->
      val = fetchValue vars, d, value
      if !val then 0 else val

    min = max if domain[0] is domain[1]

    print.timeEnd "calculating buffer scale" if vars.dev.value

    vars.size.scale.value
      .domain domain
      .rangeRound [min,max]
