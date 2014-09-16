module.exports = (vars, axis) ->

  rangeMax = vars[axis].scale.viz.range()[1]
  maxSize = vars.axes.scale.range()[1]

  domainHigh = vars[axis].scale.viz.invert -maxSize * 2
  domainLow  = vars[axis].scale.viz.invert rangeMax + maxSize * 2

  vars[axis].scale.viz.domain([domainHigh,domainLow])
