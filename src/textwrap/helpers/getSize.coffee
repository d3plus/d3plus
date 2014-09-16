# Fetches text if not specified, and formats text to array.
module.exports = (vars) ->

  size = vars.container.value.attr "font-size" or vars.container.value.style "font-size"
  vars.container.fontSize = size

  unless vars.size.value
    size = parseFloat(size, 10)
    if vars.resize.value
      vars.self.size [size, size * 2]
    else
      vars.self.size [size / 2, size]

  return
