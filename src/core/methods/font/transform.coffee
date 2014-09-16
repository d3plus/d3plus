module.exports = (transform) ->

  transform = "none" unless transform

  accepted: ["capitalize", "lowercase", "none", "uppercase"]
  value:    transform
