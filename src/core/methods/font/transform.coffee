module.exports = (transform) ->

  accepted = ["capitalize", "lowercase", "none", "uppercase"]
  accepted.unshift false if transform is false
  transform = "none" if accepted.indexOf(transform) < 0

  accepted: accepted
  value:    transform
