buckets = require "../../../../../util/buckets.coffee"
closest = require "../../../../../util/closest.coffee"

module.exports = (vars, axis, buffer) ->

  if vars[axis].scale.value isnt "share" and !vars[axis].range.value

    if axis is vars.axes.discrete

      domain = vars[axis].scale.viz.domain()

      if typeof domain[0] is "string"
        domain.unshift "d3plus_buffer_first"
        domain.push "d3plus_buffer_last"
        range = vars[axis].scale.viz.range()
        range = buckets d3.extent(range), domain.length
        vars[axis].scale.viz.domain(domain).range(range)

      else

        domain = domain.slice().reverse() if axis is "y"

        if vars[axis].ticks.values.length is 1
          if vars[axis].value is vars.time.value and
             vars.data.time.ticks.length isnt 1
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

    else if (buffer is "x" and axis is "x") or
            (buffer is "y" and axis is "y") or
            (buffer is true)

      domain = vars[axis].scale.viz.domain()
      domain = domain.slice().reverse() if axis is "y"

      allPositive = domain[0] >= 0 and domain[1] >= 0
      allNegative = domain[0] <= 0 and domain[1] <= 0

      mod = if vars[axis].scale.value is "log" then .5 else 0.05

      additional = Math.abs(domain[1] - domain[0]) * mod or 1

      if vars[axis].scale.value is "log"
        if allPositive
          zero = 1
        else
          zero = -1
      else
        zero = 0

      domain[0] = domain[0] - additional
      domain[1] = domain[1] + additional

      domain[0] = zero if (allPositive and domain[0] < zero) or
                          (allNegative and domain[0] > zero)
      domain[1] = zero if (allPositive and domain[1] < zero) or
                          (allNegative and domain[1] > zero)

      domain = domain.reverse() if axis is "y"

      vars[axis].scale.viz.domain(domain)

    else if vars.axes.scale

      rangeMax = vars[axis].scale.viz.range()[1]
      maxSize  = vars.axes.scale.range()[1]

      domainHigh = vars[axis].scale.viz.invert -maxSize * 2
      domainLow  = vars[axis].scale.viz.invert rangeMax + maxSize * 2

      if domainHigh is domainLow
        domainHigh += 1
        domainLow  -= 1

      vars[axis].scale.viz.domain([domainHigh,domainLow])
