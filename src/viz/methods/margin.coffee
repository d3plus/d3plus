module.exports =
  accepted: [Number, Object, String]
  process:  (value) ->

    self = this
    sides = ["top", "right", "bottom", "left"]

    value     = self.value if value is undefined
    userValue = value

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

    if typeof value is "number"
      for side in sides
        self[side] = value
    else
      for side of value
        sideIndex = sides.indexOf(side)
        if sideIndex >= 0
          sides.splice sideIndex, 1
          self[side] = value[side]
      for k in sides
        self[k] = 0

    userValue
  value: 0
