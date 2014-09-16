buffer     = require "./buffer.coffee"
closest    = require "../../../../../util/closest.coffee"
fetchData  = require "../../../../../core/fetch/data.js"
fetchValue = require "../../../../../core/fetch/value.js"
print      = require "../../../../../core/console/print.coffee"
uniques    = require "../../../../../util/uniques.coffee"

module.exports = (vars, b) ->

  b                 = {} if b is undefined
  changed           = dataChange vars
  vars.axes.dataset = getData vars if changed
  vars.axes.scale   = if b.buffer then sizeScale vars, b.buffer else false
  vars.axes.buffer = if typeof b.buffer is "object" and b.buffer.axis then [b.buffer.axis] else ["x","y"]
  for axis in ["x","y"]

    filtered = vars[axis].solo.changed or vars[axis].mute.changed
    modified = changed or vars[axis].changed or (vars.time.fixed.value and filtered)

    if modified or vars[axis].stacked.changed

      print.time "calculating "+axis+" axis" if vars.dev.value

      # reset ticks
      vars[axis].ticks =
        values: false

      # calculate range
      range = axisRange vars, axis

      # add padding to axis if there is only 1 value
      range = soloPadding vars, axis, range if range[0] is range[1]

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
      buffer vars, axis if axis isnt vars.axes.continuous and vars.axes.scale and vars.axes.buffer.indexOf(axis) >= 0

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

  check   = ["data","time","id","depth"]
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

axisRange = (vars, axis) ->

  if vars[axis].scale.value is "share"
    vars[axis].ticks.values = d3.range 0, 1.1, 1.1
    [0,1]
  else if vars[axis].stacked.value
    oppAxis = if axis is "x" then "y" else "x"
    axisSums = d3.nest()
      .key (d) -> fetchValue vars, d, vars[oppAxis].value
      .rollup (leaves) -> d3.sum leaves, (d) -> fetchValue vars, d, vars[axis].value
      .entries vars.axes.dataset
    [0, d3.max(axisSums, (d) -> d.values )]
  else
    d3.extent vars.axes.dataset, (d) -> fetchValue vars, d, vars[axis].value

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

sizeScale = (vars, b) ->

  b = {value: b} if typeof b isnt "object"

  value = if b.value then b.value else vars.size.value

  if typeof value is "number"
    vars.size.scale.value.rangeRound [value,value]
  else if value

    print.time "calculating buffer scale" if vars.dev.value

    min = if b.min then b.min else 2
    max = if b.max then b.max else Math.floor d3.max [d3.min([vars.width.viz,vars.height.viz])/15, min]

    domain = d3.extent vars.axes.dataset, (d) ->
      val = fetchValue vars, d, value
      if !val then 0 else val

    min = max if domain[0] is domain[1]

    print.timeEnd "calculating buffer scale" if vars.dev.value

    vars.size.scale.value
      .domain domain
      .rangeRound [min,max]
