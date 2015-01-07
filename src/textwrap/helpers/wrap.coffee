flow      = require "./flow.coffee"
fontSizes = require "../../font/sizes.coffee"

# Flows the text into the container
wrap = (vars) ->

  if vars.text.phrases.length

    vars.text.current = vars.text.phrases.shift() + ""
    vars.text.words   = vars.text.current.match vars.text.break

    # Clears out the current container text.
    vars.container.value.text ""

    if vars.resize.value then resize vars else flow vars

  return

module.exports = wrap

# Logic to determine the best size for text
resize = (vars) ->

  words = []
  i = 0

  while i < vars.text.words.length
    addon = (if i is vars.text.words.length - 1 then "" else " ")
    words.push vars.text.words[i] + addon
    i++

  # Start by trying the largest font size
  sizeMax   = Math.floor(vars.size.value[1])
  lineWidth = if vars.shape.value is "circle" then vars.width.value * 0.785 else vars.width.value
  sizes     = fontSizes words, {"font-size": sizeMax + "px"}, {parent: vars.container.value}
  maxWidth  = d3.max sizes, (d) -> d.width
  areaMod   = 1.165 + (vars.width.value / vars.height.value * 0.037)
  textArea  = d3.sum(sizes, (d) ->
      h = vars.container.dy or d.height
      d.width * h
    ) * areaMod

  if vars.shape.value is "circle"
    boxArea = Math.PI * Math.pow(vars.width.value / 2, 2)
  else
    boxArea = lineWidth * vars.height.value

  if maxWidth > lineWidth or textArea > boxArea
    areaRatio  = Math.sqrt(boxArea / textArea)
    widthRatio = lineWidth / maxWidth
    sizeRatio  = d3.min [areaRatio, widthRatio]
    sizeMax    = d3.max [vars.size.value[0], Math.floor(sizeMax * sizeRatio)]

  heightMax = Math.floor(vars.height.value * 0.8)
  sizeMax   = heightMax if sizeMax > heightMax

  if maxWidth * (sizeMax / vars.size.value[1]) <= lineWidth
    if sizeMax isnt vars.size.value[1]
      vars.self.size [vars.size.value[0], sizeMax]
    flow vars
  else
    wrap vars

  return
