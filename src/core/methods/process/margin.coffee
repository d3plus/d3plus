module.exports = (value, self) ->

  if typeof value is "string"

    value = value.split(" ")

    for v, i in value
      value[i] = parseFloat(v, 10)

    if value.length is 1
      value = value[0]
    else if value.length is 2
      value =
        top: value[0]
        right: value[1]
        bottom: value[0]
        left: value[1]
    else if value.length is 3
      value =
        top: value[0]
        right: value[1]
        bottom: value[2]
        left: value[1]
    else if value.length is 4
      value =
        top: value[0]
        right: value[1]
        bottom: value[2]
        left: value[3]
    else
      value = 0

  sides = ["top", "right", "bottom", "left"]
  if typeof value is "number"
    for side in sides
      self[side] = value
  else
    for side in sides
      self[side] = value[side]

  self.css = ""
  for side, i in sides
    self.css += " " if i
    self.css += self[side] + "px"
