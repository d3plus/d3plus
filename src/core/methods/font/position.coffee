module.exports = (position) ->

  accepted = ["top", "middle", "bottom"]
  accepted.unshift false if position is false
  position = "bottom" if accepted.indexOf(position) < 0

  accepted: accepted
  mapping:
    top: "0ex"
    middle: "0.5ex"
    bottom: "1ex"
  process: (value) ->
    @text = value
    @mapping[value]
  value: position
