module.exports = (decoration) ->

  accepted = ["line-through", "none", "overline", "underline"]
  accepted.unshift false if decoration is false
  decoration = "none" if accepted.indexOf(decoration) < 0

  accepted: accepted
  value:    decoration
