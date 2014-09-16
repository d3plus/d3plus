module.exports = (decoration) ->

  decoration = "none" unless decoration

  accepted: ["line-through", "none", "overline", "underline"]
  value:    decoration
