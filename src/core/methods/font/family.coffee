validate  = require "../../../font/validate.coffee"
helvetica = ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"]

# Constructs font family property using the validate function
module.exports = (family) ->

  family = helvetica if family is undefined

  process: validate
  value:   family
