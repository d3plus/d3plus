module.exports = (vars, axis, buffer) ->

  if axis is vars.axes.continuous

    domain     = vars[axis].scale.viz.domain()
    domain     = domain.slice().reverse() if axis is "y"
    difference = Math.abs domain[1] - domain[0]
    additional = difference / (vars[axis].ticks.values.length - 1)
    additional = additional / 2

    domain[0] = domain[0] - additional
    domain[1] = domain[1] + additional

    domain = domain.reverse() if axis is "y"

    vars[axis].scale.viz.domain(domain)

  else if (buffer is "x" and axis is "x") or (buffer is "y" and axis is "y")

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
