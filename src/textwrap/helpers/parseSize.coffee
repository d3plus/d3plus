module.exports = (vars) ->

  elem = vars.container.value

  prev  = elem.node().previousElementSibling
  shape = if prev then prev.tagName.toLowerCase() else ""
  prev  = d3.select(prev) if prev

  vars.container.x = vars.x.value or parseFloat(elem.attr("x"), 10)
  vars.container.y = vars.y.value or parseFloat(elem.attr("y"), 10)

  # Checks width and height, and gets it if needed.
  if prev

    vars.self.shape shape if vars.shape.accepted.indexOf(shape) >= 0

    if shape is "rect"

      x = parseFloat(prev.attr("x"), 10) or 0
      y = parseFloat(prev.attr("y"), 10) or 0

      # Detects padding.
      if vars.padding.value is false
        diff = Math.abs x - vars.container.x
        vars.self.padding(diff) if diff

      vars.container.x = x + vars.padding.value unless vars.container.x
      vars.container.y = y + vars.padding.value unless vars.container.y

      unless vars.width.value
        width = parseFloat(prev.attr "width" or prev.style "width", 10)
        vars.self.width width

      unless vars.height.value
        height = parseFloat(prev.attr "height" or prev.style "height", 10)
        vars.self.height height

    else if shape is "circle"

      radius = parseFloat prev.attr("r"), 10

      x = parseFloat(prev.attr("cx"), 10) or 0
      x -= radius
      y = parseFloat(prev.attr("cy"), 10) or 0
      y -= radius

      # Detects padding.
      if vars.padding.value is false
        diff = Math.abs x - vars.container.x
        vars.self.padding(diff) if diff

      vars.container.x = x + vars.padding.value unless vars.container.x
      vars.container.y = y + vars.padding.value unless vars.container.y

      vars.self.width radius * 2, 10 unless vars.width.value
      vars.self.height radius * 2, 10 unless vars.height.value

    else

      vars.self.width 500 unless vars.width.value
      vars.self.height 500 unless vars.height.value

  vars.container.x = 0 unless vars.container.x
  vars.container.y = 0 unless vars.container.y

  # Sets the inner width and weight.
  vars.width.inner  = vars.width.value - vars.padding.value * 2
  vars.height.inner = vars.height.value - vars.padding.value * 2

  # Detects the font size.
  size = elem.attr("font-size") or elem.style("font-size")
  size = parseFloat size, 10
  vars.container.fontSize = size

  vars.container.dy = parseFloat elem.attr("dy"), 10

  # Sets .size( ) method, if not specififed.
  unless vars.size.value
    if vars.resize.value
      vars.self.size [4, 80]
    else
      vars.self.size [size / 2, size]
