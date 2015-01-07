module.exports = (vars) ->

  elem = vars.container.value

  # Checks width and height, and gets it if needed.
  if not vars.width.value or not vars.height.value

    prev  = elem.node().previousElementSibling
    shape = if prev then prev.tagName.toLowerCase() else ""
    prev  = d3.select(prev) if prev

    if shape is "rect"
      vars.shape.value = shape
      unless vars.width.value
        width = prev.attr "width" or prev.style "width"
        vars.self.width parseFloat width, 10
      unless vars.height.value
        height = prev.attr "height" or prev.style "height"
        vars.self.height parseFloat height, 10
    else if shape is "circle"
      vars.shape.value = shape
      radius = prev.attr "r"
      vars.self.width parseFloat(radius) * 2, 10 unless vars.width.value
      vars.self.height parseFloat(radius) * 2, 10 unless vars.height.value
    else
      vars.self.width 500 unless vars.width.value
      vars.self.height 500 unless vars.height.value

  # Detects the font size.
  size = elem.attr("font-size") or elem.style("font-size")
  size = parseFloat size, 10
  vars.container.fontSize = size

  vars.container.dy = parseFloat elem.attr("dy"), 10

  # Sets .size( ) method, if not specififed.
  unless vars.size.value
    if vars.resize.value
      vars.self.size [size, size * 2]
    else
      vars.self.size [size / 2, size]
