module.exports = (position) ->

  position = "bottom" unless position

  accepted: ["top", "middle", "bottom"]
  mapping:
    top: "0ex"
    middle: "0.5ex"
    bottom: "1ex"
  process: (value) ->
    @text = value
    @mapping[value]
  value: position
