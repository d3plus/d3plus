closest = require "../../../../../util/closest.coffee"

module.exports = (vars, axis, buffer) ->

  if vars[axis].scale.value isnt "share"
    if axis is vars.axes.discrete

      domain = vars[axis].scale.viz.domain()
      domain = domain.slice().reverse() if axis is "y"

      if vars[axis].ticks.values.length is 1
        if vars[axis].value is vars.time.value
          closestTime = closest(vars.data.time.ticks, domain[0])
          timeIndex = vars.data.time.ticks.indexOf(closestTime)
          if timeIndex > 0
            domain[0] = vars.data.time.ticks[timeIndex - 1]
          else
            diff = vars.data.time.ticks[timeIndex + 1] - closestTime
            domain[0] = new Date(closestTime.getTime() - diff)
          if timeIndex < vars.data.time.ticks.length - 1
            domain[1] = vars.data.time.ticks[timeIndex + 1]
          else
            diff = closestTime - vars.data.time.ticks[timeIndex - 1]
            domain[1] = new Date(closestTime.getTime() + diff)
        else
          domain[0] -= 1
          domain[1] += 1
      else
        difference = Math.abs domain[1] - domain[0]
        additional = difference / (vars[axis].ticks.values.length - 1)
        additional = additional / 2

        domain[0] = domain[0] - additional
        domain[1] = domain[1] + additional

      domain = domain.reverse() if axis is "y"
      vars[axis].scale.viz.domain(domain)

    else if (buffer is "x" and axis is "x") or (buffer is "y" and axis is "y") or (buffer is true)

      domain = vars[axis].scale.viz.domain()
      domain = domain.slice().reverse() if axis is "y"

      allPositive = domain[0] >= 0 and domain[1] >= 0
      allNegative = domain[0] <= 0 and domain[1] <= 0

      additional = Math.abs(domain[1] - domain[0]) * 0.05

      domain[0] = domain[0] - additional
      domain[1] = domain[1] + additional

      domain[0] = 0 if (allPositive and domain[0] < 0) or (allNegative and domain[0] > 0)
      domain[1] = 0 if (allPositive and domain[1] < 0) or (allNegative and domain[1] > 0)

      domain = domain.reverse() if axis is "y"

      vars[axis].scale.viz.domain(domain)

    else if vars.axes.scale and buffer isnt "y" and buffer isnt "x"

      rangeMax = vars[axis].scale.viz.range()[1]
      maxSize  = vars.axes.scale.range()[1]

      domainHigh = vars[axis].scale.viz.invert -maxSize * 2
      domainLow  = vars[axis].scale.viz.invert rangeMax + maxSize * 2

      vars[axis].scale.viz.domain([domainHigh,domainLow])
