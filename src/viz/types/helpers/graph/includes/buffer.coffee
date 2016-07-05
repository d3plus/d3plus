buckets = require "../../../../../util/buckets.coffee"
closest = require "../../../../../util/closest.coffee"

module.exports = (vars, axis, buffer) ->

  if vars[axis].scale.value isnt "share" and !vars[axis].range.value and vars[axis].reset

    testScale = vars[axis].scale.viz.copy()
    testScale.clamp(false) if "clamp" of testScale

    if axis is vars.axes.discrete

      domain = testScale.domain()

      if typeof domain[0] is "string"
        i = domain.length
        while i >= 0
          domain.splice(i, 0, "d3plus_buffer_"+i)
          i--
        range = testScale.range()
        range = buckets d3.extent(range), domain.length
        vars[axis].scale.viz.domain(domain).range(range)

      else

        domain = domain.slice().reverse() if axis.indexOf("y") is 0

        if vars[axis].ticks.values.length is 1
          domain = [domain[0], domain[0]]
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

        else if vars.axes.scale

          difference = Math.abs domain[1] - domain[0]
          additional = difference / (vars[axis].ticks.values.length - 1)
          additional = additional / 2

          rangeMax = testScale.range()[1]
          maxSize  = vars.axes.scale.range()[1] * 1.5
          domainLow = testScale.invert -maxSize
          domainHigh  = testScale.invert rangeMax + maxSize

          if domain[0] - additional < domainLow

            domain[0] = domain[0] - additional
            domain[domain.length - 1] = domain[domain.length - 1] + additional

          else

            domain = [domainLow, domainHigh]
            domain = domain.reverse() if axis.indexOf("y") is 0

            domainCompare = testScale.domain()
            domainCompare = domainCompare[1] - domainCompare[0]

            unless domainCompare
              domain[0] -= 1
              domain[1] += 1

        else if vars[axis].value is vars.time.value
          difference = Math.abs domain[1] - domain[0]
          additional = difference / (vars[axis].ticks.values.length - 1)
          additional = additional / 2

          domain[0] = domain[0] - additional
          domain[1] = domain[1] + additional

        else
          difference = Math.abs domain[1] - domain[0]
          add = difference / 2

          i = domain.length
          orig_domain = domain.slice()
          while i >= 0
            d = if i then orig_domain[i - 1] + add else orig_domain[i] - add
            domain.splice(i, 0, d)
            i--
          range = testScale.range()
          range = buckets d3.extent(range), domain.length
          vars[axis].scale.viz.domain(domain).range(range)

        domain = domain.reverse() if axis.indexOf("y") is 0

        vars[axis].scale.viz.domain(domain)

    else if (buffer is "x" and axis.indexOf("x") is 0) or
            (buffer is "y" and axis.indexOf("y") is 0) or
            (buffer is true)

      domain = testScale.domain()

      allPositive = domain[0] >= 0 and domain[1] >= 0
      allNegative = domain[0] <= 0 and domain[1] <= 0

      if vars[axis].scale.value is "log"

        zero = if allPositive then 1 else -1
        domain = domain.slice().reverse() if allPositive and axis.indexOf("y") is 0

        lowerScale = Math.pow(10, parseInt(Math.abs(domain[0])).toString().length - 1) * zero
        lowerMod = domain[0] % lowerScale
        lowerDiff = lowerMod
        if lowerMod and lowerDiff/lowerScale <= 0.1
          lowerDiff += lowerScale * zero
        lowerValue = if lowerMod is 0 then lowerScale else lowerDiff
        domain[0] -= lowerValue
        domain[0] = zero if domain[0] is 0

        upperScale = Math.pow(10, parseInt(Math.abs(domain[1])).toString().length - 1) * zero
        upperMod = domain[1] % upperScale
        upperDiff = Math.abs(upperScale - upperMod)
        if upperMod and upperDiff/upperScale <= 0.1
          upperDiff += upperScale * zero
        upperValue = if upperMod is 0 then upperScale else upperDiff
        domain[1] += upperValue
        domain[1] = zero if domain[1] is 0

        domain = domain.reverse() if allPositive and axis.indexOf("y") is 0

      else
        zero = 0
        domain = domain.slice().reverse() if axis.indexOf("y") is 0

        strings = domain.filter (d) -> d.constructor is String
        additional = Math.abs(domain[1] - domain[0]) * 0.05 or 1

        unless strings.length

          domain[0] = domain[0] - additional
          domain[1] = domain[1] + additional

          domain[0] = zero if (allPositive and domain[0] < zero) or
                              (allNegative and domain[0] > zero)
          domain[1] = zero if (allPositive and domain[1] < zero) or
                              (allNegative and domain[1] > zero)

        domain = domain.reverse() if axis.indexOf("y") is 0

      vars[axis].scale.viz.domain(domain)

    else if vars.axes.scale

      copy = false
      if vars.axes.mirror.value

        opp = if axis.indexOf("y") is 0 then "x" else "y"
        copy = vars[opp].scale.viz
        second = if vars.width.viz > vars.height.viz then "x" else "y"

      if axis is second and copy

        domain = copy.domain().slice().reverse()

      else

        rangeMax = testScale.range()[1]
        maxSize  = vars.axes.scale.range()[1]

        domainLow = testScale.invert -maxSize*1.5
        domainHigh  = testScale.invert rangeMax + maxSize*1.5

        domain = [domainLow, domainHigh]
        domain = domain.reverse() if axis.indexOf("y") is 0

        domainCompare = testScale.domain()
        domainCompare = domainCompare[1] - domainCompare[0]

        unless domainCompare
          domain[0] -= 1
          domain[1] += 1

        domain = domain.reverse() if axis.indexOf("y") is 0

      vars[axis].scale.viz.domain(domain)
