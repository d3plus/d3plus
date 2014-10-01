format = require "./format.js"
locale = require("../core/locale/languages/en_US.coffee").ui

# Converts an array of strings into a string list using commas and "and".
module.exports = (list, andText, max, moreText) ->
  unless list instanceof Array
    return list
  else
    list = list.slice(0)
  andText = locale.and unless andText
  moreText = locale.moreText unless moreText
  if list.length is 2
    list.join " " + andText + " "
  else
    if max and list.length > max
      amount = list.length - max + 1
      list = list.slice(0, max - 1)
      list[max - 1] = format(moreText, amount)
    list[list.length - 1] = andText + " " + list[list.length - 1]  if list.length > 1
    list.join ", "
