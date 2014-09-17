module.exports = (vars, axis, buffer) ->

  if (buffer is "x" and axis is "x") or (buffer is "y" and axis is "y")

    domain = vars[axis].scale.viz.domain()

    allPositive = domain[0] > 0 and domain[1] > 0
    allNegative = domain[0] < 0 and domain[0] < 0

    if axis is "y"
      domain[0] = domain[0] * 1.05
      domain[1] = domain[1] * 0.95
    else
      domain[0] = domain[0] * 0.95
      domain[1] = domain[1] * 1.05

    domain[0] = 0 if (allPositive and domain[0] < 0) or (allNegative and domain[0] > 0)
    domain[1] = 0 if (allPositive and domain[1] < 0) or (allNegative and domain[1] > 0)

    vars[axis].scale.viz.domain(domain)

  else if vars.axes.scale and buffer isnt "y" and buffer isnt "x"

    rangeMax = vars[axis].scale.viz.range()[1]
    maxSize  = vars.axes.scale.range()[1]

    domainHigh = vars[axis].scale.viz.invert -maxSize * 2
    domainLow  = vars[axis].scale.viz.invert rangeMax + maxSize * 2

    vars[axis].scale.viz.domain([domainHigh,domainLow])
